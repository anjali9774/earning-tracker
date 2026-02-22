package com.iconcile.expense.dto;

import com.iconcile.expense.model.Expense;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
public class DashboardResponse {
    private Map<String, BigDecimal> monthlyCategoryTotals;
    private List<VendorTotal> topVendors;
    private List<Expense> anomalies;
    private int anomalyCount;
    private int month;
    private int year;

    @Data
    public static class VendorTotal {
        private String vendorName;
        private BigDecimal total;

        public VendorTotal(String vendorName, BigDecimal total) {
            this.vendorName = vendorName;
            this.total = total;
        }
    }
}
