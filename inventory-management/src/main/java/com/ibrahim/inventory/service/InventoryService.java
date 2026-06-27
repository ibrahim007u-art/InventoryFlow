package com.ibrahim.inventory.service;

import com.ibrahim.inventory.entity.Inventory;
import com.ibrahim.inventory.exception.ResourceNotFoundException;
import com.ibrahim.inventory.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import com.ibrahim.inventory.exception.InsufficientStockException;

import com.ibrahim.inventory.entity.StockMovement;
import com.ibrahim.inventory.repository.StockMovementRepository;

import com.ibrahim.inventory.dto.InventoryValueResponse;
import java.math.BigDecimal;
import java.util.stream.Collectors;

import java.time.LocalDateTime;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    private final StockMovementRepository
            stockMovementRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            StockMovementRepository stockMovementRepository){

        this.inventoryRepository =
                inventoryRepository;

        this.stockMovementRepository =
                stockMovementRepository;
    }

    public List<Inventory> getAllInventory(){

        return inventoryRepository.findAll();
    }

    public Inventory addStock(
            Long inventoryId,
            Integer quantity){

        Inventory inventory =
                inventoryRepository
                        .findById(inventoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Inventory Not Found"));

        inventory.setQuantity(
                inventory.getQuantity()
                        + quantity);

        Inventory updatedInventory =
                inventoryRepository
                        .save(inventory);

        StockMovement movement =
                new StockMovement();

        movement.setProduct(
                inventory.getProduct());

        movement.setType("IN");

        movement.setQuantity(
                quantity);

        movement.setNote(
                "Stock Added");

        movement.setMovementDate(
                LocalDateTime.now());

        movement.setCreatedAt(
                LocalDateTime.now());

        stockMovementRepository
                .save(movement);

        return updatedInventory;
    }

    public Inventory reduceStock(
            Long inventoryId,
            Integer quantity){

        Inventory inventory =
                inventoryRepository
                        .findById(inventoryId)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Inventory Not Found"));

        if(inventory.getQuantity() < quantity){

            throw new InsufficientStockException(
                    "Insufficient Stock");
        }

        inventory.setQuantity(
                inventory.getQuantity()
                        - quantity);

        Inventory updatedInventory =
                inventoryRepository
                        .save(inventory);

        StockMovement movement =
                new StockMovement();

        movement.setProduct(
                inventory.getProduct());

        movement.setType("OUT");

        movement.setQuantity(
                quantity);

        movement.setNote(
                "Stock Reduced");

        movement.setMovementDate(
                LocalDateTime.now());

        movement.setCreatedAt(
                LocalDateTime.now());

        stockMovementRepository
                .save(movement);

        return updatedInventory;
    }
    public List<Inventory>
    getLowStockProducts(){

        return inventoryRepository
                .findLowStockProducts();
    }

    public List<Inventory> getOutOfStockProducts(){

        return inventoryRepository
                .findByQuantity(0);
    }

    public List<InventoryValueResponse>
    getInventoryValueReport(){

        return inventoryRepository
                .findAll()
                .stream()
                .map(inventory -> {

                    InventoryValueResponse response =
                            new InventoryValueResponse();

                    response.setProductName(
                            inventory
                                    .getProduct()
                                    .getName());

                    response.setQuantity(
                            inventory.getQuantity());

                    response.setPrice(
                            inventory
                                    .getProduct()
                                    .getPrice());

                    BigDecimal totalValue =
                            inventory.getProduct()
                                    .getPrice()
                                    .multiply(
                                            BigDecimal.valueOf(
                                                    inventory.getQuantity()));

                    response.setTotalValue(
                            totalValue);

                    return response;

                })
                .collect(Collectors.toList());

    }
}