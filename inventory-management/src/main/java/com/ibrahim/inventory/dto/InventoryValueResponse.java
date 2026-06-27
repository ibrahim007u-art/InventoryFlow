package com.ibrahim.inventory.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class InventoryValueResponse {

    private String productName;

    private Integer quantity;

    private BigDecimal price;

    private BigDecimal totalValue;
}