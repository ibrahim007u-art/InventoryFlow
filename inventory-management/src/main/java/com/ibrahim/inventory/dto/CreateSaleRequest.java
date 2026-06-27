package com.ibrahim.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateSaleRequest {

    private String customerName;

    @NotEmpty
    @Valid
    private List<SaleItemRequest> items;
}