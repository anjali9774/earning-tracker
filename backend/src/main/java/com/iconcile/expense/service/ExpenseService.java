package com.iconcile.expense.service;

import com.iconcile.expense.dto.DashboardResponse;
import com.iconcile.expense.dto.ExpenseRequest;
import com.iconcile.expense.model.Expense;
import com.iconcile.expense.repository.ExpenseRepository;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategorizationService categorizationService;

    private static final BigDecimal ANOMALY_MULTIPLIER = new BigDecimal("3");

    public Expense addExpense(ExpenseRequest request) {
        Expense expense = new Expense();
        expense.setDate(request.getDate());
        expense.setAmount(request.getAmount());
        expense.setVendorName(request.getVendorName());
        expense.setDescription(request.getDescription());

        // Apply rule-based categorization; allow manual override
        String category = (request.getCategory() != null && !request.getCategory().isBlank())
                ? request.getCategory()
                : categorizationService.categorize(request.getVendorName());
        expense.setCategory(category);

        // Save first to include in average calculation
        expense = expenseRepository.save(expense);

        // Check anomaly after saving
        boolean isAnomaly = checkAnomaly(expense);
        expense.setAnomaly(isAnomaly);
        return expenseRepository.save(expense);
    }

    /**
     * Anomaly Detection:
     * An expense is flagged as anomaly if its amount > 3× the average amount for its category.
     * Average is computed across ALL expenses in that category (including the current one).
     */
    private boolean checkAnomaly(Expense expense) {
        BigDecimal avg = expenseRepository.findAverageAmountByCategory(expense.getCategory());
        if (avg == null || avg.compareTo(BigDecimal.ZERO) == 0) return false;
        BigDecimal threshold = avg.multiply(ANOMALY_MULTIPLIER);
        return expense.getAmount().compareTo(threshold) > 0;
    }

    /**
     * Re-evaluate anomaly status for all expenses in a category.
     * Called after batch uploads where averages may shift significantly.
     */
    private void reEvaluateAnomalies(String category) {
        BigDecimal avg = expenseRepository.findAverageAmountByCategory(category);
        if (avg == null) return;
        BigDecimal threshold = avg.multiply(ANOMALY_MULTIPLIER);
        List<Expense> all = expenseRepository.findAll();
        for (Expense e : all) {
            if (e.getCategory().equals(category)) {
                e.setAnomaly(e.getAmount().compareTo(threshold) > 0);
            }
        }
        expenseRepository.saveAll(all);
    }

    public List<Expense> uploadCsv(MultipartFile file) throws IOException, CsvValidationException {
        List<Expense> saved = new ArrayList<>();
        Set<String> affectedCategories = new HashSet<>();

        try (CSVReader csvReader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = csvReader.readNext(); // skip header row
            String[] row;
            while ((row = csvReader.readNext()) != null) {
                try {
                    // Expected CSV columns: date, amount, vendor_name, description
                    // Flexible date parsing
                    LocalDate date = parseDate(row[0].trim());
                    BigDecimal amount = new BigDecimal(row[1].trim());
                    String vendorName = row[2].trim();
                    String description = row.length > 3 ? row[3].trim() : "";

                    Expense expense = new Expense();
                    expense.setDate(date);
                    expense.setAmount(amount);
                    expense.setVendorName(vendorName);
                    expense.setDescription(description);
                    expense.setCategory(categorizationService.categorize(vendorName));

                    saved.add(expenseRepository.save(expense));
                    affectedCategories.add(expense.getCategory());
                } catch (Exception e) {
                    // Skip malformed rows; could log them
                    System.err.println("Skipping malformed CSV row: " + Arrays.toString(row) + " - " + e.getMessage());
                }
            }
        }

        // Re-evaluate anomalies for all affected categories after batch insert
        for (String category : affectedCategories) {
            reEvaluateAnomalies(category);
        }

        return saved;
    }

    private LocalDate parseDate(String dateStr) {
        List<DateTimeFormatter> formatters = List.of(
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy")
        );
        for (DateTimeFormatter f : formatters) {
            try { return LocalDate.parse(dateStr, f); } catch (Exception ignored) {}
        }
        throw new IllegalArgumentException("Cannot parse date: " + dateStr);
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public List<Expense> getAnomalies() {
        return expenseRepository.findByAnomalyTrue();
    }

    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }

    public DashboardResponse getDashboard(int year, int month) {
        DashboardResponse response = new DashboardResponse();
        response.setYear(year);
        response.setMonth(month);

        // Monthly category totals
        List<Object[]> categoryTotals = expenseRepository.findMonthlyCategoryTotalsNative(year, month);
        Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
        for (Object[] row : categoryTotals) {
            categoryMap.put((String) row[0], (BigDecimal) row[1]);
        }
        response.setMonthlyCategoryTotals(categoryMap);

        // Top 5 vendors
        List<Object[]> vendorTotals = expenseRepository.findTop5VendorsBySpend();
        List<DashboardResponse.VendorTotal> topVendors = new ArrayList<>();
        for (Object[] row : vendorTotals) {
            topVendors.add(new DashboardResponse.VendorTotal((String) row[0], (BigDecimal) row[1]));
        }
        response.setTopVendors(topVendors);

        // Anomalies
        List<Expense> anomalies = expenseRepository.findByAnomalyTrue();
        response.setAnomalies(anomalies);
        response.setAnomalyCount(anomalies.size());

        return response;
    }
}
