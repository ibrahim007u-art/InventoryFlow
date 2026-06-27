package com.ibrahim.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class SalesInvoiceResponse {

    private Long invoiceId;

    private String invoiceNumber;

    private String customerName;

    private LocalDateTime createdAt;

    private List<SalesInvoiceItemResponse> items;

    private BigDecimal totalAmount;
}