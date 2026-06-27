package com.ibrahim.inventory.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DashboardResponse {

    private Long totalProducts;

    private Long totalCategories;

    private Long totalSuppliers;

    private Long totalInventories;

}