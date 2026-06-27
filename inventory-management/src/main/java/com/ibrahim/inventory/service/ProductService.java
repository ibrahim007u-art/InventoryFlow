package com.ibrahim.inventory.service;

import com.ibrahim.inventory.dto.ProductDto;
import com.ibrahim.inventory.entity.Category;
import com.ibrahim.inventory.entity.Product;
import com.ibrahim.inventory.entity.Supplier;
import com.ibrahim.inventory.exception.ResourceNotFoundException;
import com.ibrahim.inventory.repository.CategoryRepository;
import com.ibrahim.inventory.repository.ProductRepository;
import com.ibrahim.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.ibrahim.inventory.dto.UpdateProductRequest;

import com.ibrahim.inventory.entity.Inventory;
import com.ibrahim.inventory.entity.StockMovement;
import com.ibrahim.inventory.repository.InventoryRepository;
import com.ibrahim.inventory.repository.StockMovementRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;

    private final InventoryRepository inventoryRepository;

    private final StockMovementRepository stockMovementRepository;


    public ProductDto createProduct(
            ProductDto request){

        Category category =
                categoryRepository
                        .findById(request.getCategoryId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Category Not Found"));

        Supplier supplier =
                supplierRepository
                        .findById(request.getSupplierId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Supplier Not Found"));

        Product product = new Product();

        product.setName(
                request.getName());

        product.setDescription(
                request.getDescription());

        product.setSku(
                request.getSku());

        product.setPrice(
                request.getPrice());

        product.setMinimumStock(
                request.getMinimumStock());

        product.setCategory(
                category);

        product.setSupplier(
                supplier);

        product.setCreatedAt(
                LocalDateTime.now());

        product.setUpdatedAt(
                LocalDateTime.now());

        Product savedProduct =
                productRepository.save(product);

        Inventory inventory =
                new Inventory();

        inventory.setProduct(savedProduct);
        inventory.setQuantity(request.getQuantity());
        inventory.setCreatedAt(LocalDateTime.now());
        inventory.setUpdatedAt(LocalDateTime.now());

        inventoryRepository.save(inventory);

        StockMovement movement =
                new StockMovement();

        movement.setProduct(savedProduct);
        movement.setType("IN");
        movement.setQuantity(request.getQuantity());
        movement.setNote("Initial Stock");
        movement.setMovementDate(LocalDateTime.now());
        movement.setCreatedAt(LocalDateTime.now());

        stockMovementRepository.save(movement);

        return ProductDto.builder()
                .name(savedProduct.getName())
                .description(savedProduct.getDescription())
                .price(savedProduct.getPrice())
                .sku(savedProduct.getSku())
                .categoryId(savedProduct.getCategory().getId())
                .supplierId(savedProduct.getSupplier().getId())
                .minimumStock(savedProduct.getMinimumStock())
                .quantity(inventory.getQuantity())
                .build();
    }

    public List<Product> getAllProducts(){

        return productRepository.findAll();
    }

    public List<Product> searchProducts(
            String keyword){

        List<Product> products =
                productRepository
                        .findByNameContainingIgnoreCaseOrSkuContainingIgnoreCase(
                                keyword,
                                keyword);

        if(products.isEmpty()){

            throw new ResourceNotFoundException(
                    "Product Not Found");
        }

        return products;
    }

    public Product getProductById(Long id){

        return productRepository.findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Product Not Found"));
    }

    public Product updateProduct(
            Long id,
            UpdateProductRequest request){

        Product product =
                getProductById(id);

        Category category =
                categoryRepository
                        .findById(
                                request.getCategoryId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Category Not Found"));

        Supplier supplier =
                supplierRepository
                        .findById(
                                request.getSupplierId())
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Supplier Not Found"));

        product.setName(
                request.getName());

        product.setDescription(
                request.getDescription());

        product.setSku(
                request.getSku());

        product.setPrice(
                request.getPrice());

        product.setMinimumStock(
                request.getMinimumStock());

        product.setCategory(
                category);

        product.setSupplier(
                supplier);

        product.setUpdatedAt(
                java.time.LocalDateTime.now());

        return productRepository.save(
                product);
    }

    public void deleteProduct(Long id){

        Product product =
                getProductById(id);

        productRepository.delete(product);
    }

}