package com.iconcile.expense.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    @NotNull
    private LocalDate date;

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private String vendorName;

    private String description;

    // optional: allow manual override
    private String category;
}
