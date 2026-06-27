package com.ibrahim.inventory.service;

import com.ibrahim.inventory.dto.DashboardResponse;
import com.ibrahim.inventory.repository.CategoryRepository;
import com.ibrahim.inventory.repository.InventoryRepository;
import com.ibrahim.inventory.repository.ProductRepository;
import com.ibrahim.inventory.repository.SupplierRepository;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;

    public DashboardService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            SupplierRepository supplierRepository,
            InventoryRepository inventoryRepository){

        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public DashboardResponse getDashboard(){

        DashboardResponse response =
                new DashboardResponse();

        response.setTotalProducts(
                productRepository.count());

        response.setTotalCategories(
                categoryRepository.count());

        response.setTotalSuppliers(
                supplierRepository.count());

        response.setTotalInventories(
                inventoryRepository.count());

        return response;
    }
}