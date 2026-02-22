package com.iconcile.expense.repository;

import com.iconcile.expense.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByAnomalyTrue();

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e " +
           "WHERE YEAR(e.date) = :year AND MONTH(e.date) = :month " +
           "GROUP BY e.category")
    List<Object[]> findMonthlyCategoryTotals(@Param("year") int year, @Param("month") int month);

    @Query("SELECT e.vendorName, SUM(e.amount) as total FROM Expense e " +
           "GROUP BY e.vendorName ORDER BY total DESC")
    List<Object[]> findTopVendorsBySpend();

    @Query("SELECT AVG(e.amount) FROM Expense e WHERE e.category = :category")
    BigDecimal findAverageAmountByCategory(@Param("category") String category);

    @Query(value = "SELECT e.category, SUM(e.amount) as total FROM expenses e " +
                   "WHERE EXTRACT(YEAR FROM e.date) = :year AND EXTRACT(MONTH FROM e.date) = :month " +
                   "GROUP BY e.category", nativeQuery = true)
    List<Object[]> findMonthlyCategoryTotalsNative(@Param("year") int year, @Param("month") int month);

    @Query(value = "SELECT e.vendor_name, SUM(e.amount) as total FROM expenses e " +
                   "GROUP BY e.vendor_name ORDER BY total DESC LIMIT 5", nativeQuery = true)
    List<Object[]> findTop5VendorsBySpend();
}
