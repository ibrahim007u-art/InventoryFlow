package com.ibrahim.inventory.controller;

import com.ibrahim.inventory.dto.AddStockRequest;
import com.ibrahim.inventory.dto.ReduceStockRequest;
import com.ibrahim.inventory.entity.Inventory;
import com.ibrahim.inventory.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import com.ibrahim.inventory.dto.InventoryValueResponse;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(
            InventoryService inventoryService){

        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<Inventory> getAllInventory(){

        return inventoryService
                .getAllInventory();
    }

    @GetMapping("/low-stock")
    public List<Inventory> getLowStockProducts(){

        return inventoryService
                .getLowStockProducts();
    }

    @GetMapping("/out-of-stock")
    public List<Inventory>
    getOutOfStockProducts(){

        return inventoryService
                .getOutOfStockProducts();
    }

    @PutMapping("/{id}/add-stock")
    public Inventory addStock(
            @PathVariable Long id,
            @RequestBody AddStockRequest request){

        return inventoryService
                .addStock(
                        id,
                        request.getQuantity());
    }

    @PutMapping("/{id}/reduce-stock")
    public Inventory reduceStock(
            @PathVariable Long id,
            @RequestBody ReduceStockRequest request){

        return inventoryService
                .reduceStock(
                        id,
                        request.getQuantity());
    }

    @GetMapping("/inventory-value")
    public List<InventoryValueResponse>
    getInventoryValueReport(){

        return inventoryService
                .getInventoryValueReport();
    }


}