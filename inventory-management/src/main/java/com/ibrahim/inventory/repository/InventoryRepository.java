package com.ibrahim.inventory.repository;

import com.ibrahim.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    List<Inventory> findByQuantityLessThanEqual(
            Integer quantity);

    @Query("""
SELECT i
FROM Inventory i
WHERE i.quantity <= i.product.minimumStock
""")
    List<Inventory> findLowStockProducts();

    List<Inventory> findByQuantity(
            Integer quantity);
}