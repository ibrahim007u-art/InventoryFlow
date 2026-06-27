package com.ibrahim.inventory.repository;

import com.ibrahim.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockMovementRepository
        extends JpaRepository<StockMovement,Long>{

    List<StockMovement>
    findByProductId(Long productId);

}