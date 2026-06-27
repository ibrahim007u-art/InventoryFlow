package com.ibrahim.inventory.service;

import com.ibrahim.inventory.entity.StockMovement;
import com.ibrahim.inventory.repository.StockMovementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StockMovementService {

    private final StockMovementRepository
            stockMovementRepository;

    public StockMovementService(
            StockMovementRepository stockMovementRepository){

        this.stockMovementRepository =
                stockMovementRepository;
    }

    public List<StockMovement>
    getAllMovements(){

        return stockMovementRepository
                .findAll();
    }

    public List<StockMovement>
    getByProduct(Long productId){

        return stockMovementRepository
                .findByProductId(productId);
    }

}