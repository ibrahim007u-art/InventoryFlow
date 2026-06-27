package com.ibrahim.inventory.controller;

import com.ibrahim.inventory.dto.ProductDto;
import com.ibrahim.inventory.dto.UpdateProductRequest;
import com.ibrahim.inventory.entity.Product;
import com.ibrahim.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(
            ProductService productService){

        this.productService = productService;
    }


    @GetMapping
    public List<Product> getAllProducts(){

        return productService
                .getAllProducts();
    }

    @GetMapping("/{id}")
    public Product getProductById(
            @PathVariable Long id){

        return productService
                .getProductById(id);
    }

    @GetMapping("/search")
    public List<Product> searchProducts(
            @RequestParam String keyword){

        return productService
                .searchProducts(keyword);
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Long id,

            @Valid
            @RequestBody UpdateProductRequest request){

        return productService
                .updateProduct(
                        id,
                        request);
    }

    @DeleteMapping("/{id}")
    public String deleteProduct(
            @PathVariable Long id){

        productService.deleteProduct(id);

        return "Product Deleted Successfully";
    }

    @PostMapping
    public ProductDto createProduct(

            @Valid
            @RequestBody ProductDto request){

        return productService
                .createProduct(request);
    }

}