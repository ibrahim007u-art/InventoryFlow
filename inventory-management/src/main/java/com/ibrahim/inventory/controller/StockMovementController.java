package com.ibrahim.inventory.controller;

import com.ibrahim.inventory.entity.StockMovement;
import com.ibrahim.inventory.service.StockMovementService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stock-movements")
public class StockMovementController {

    private final StockMovementService
            stockMovementService;

    public StockMovementController(
            StockMovementService stockMovementService){

        this.stockMovementService =
                stockMovementService;
    }

    @GetMapping
    public List<StockMovement>
    getAllMovements(){

        return stockMovementService
                .getAllMovements();
    }

    @GetMapping("/product/{productId}")
    public List<StockMovement>
    getByProduct(
            @PathVariable Long productId){

        return stockMovementService
                .getByProduct(productId);
    }
}