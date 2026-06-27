package com.ibrahim.inventory.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddStockRequest {

    @NotNull
    private Integer quantity;
}