package com.ibrahim.inventory.controller;

import com.ibrahim.inventory.dto.CreateCategoryRequest;
import org.springframework.web.bind.annotation.PutMapping;
import com.ibrahim.inventory.dto.UpdateCategoryRequest;
import com.ibrahim.inventory.entity.Category;
import com.ibrahim.inventory.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@RestController
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService){

        this.categoryService =
                categoryService;
    }

    @GetMapping("/api/categories")
    public List<Category> getAllCategories(){

        return categoryService
                .getAllCategories();
    }

    @PostMapping("/api/categories")
    public Category createCategory(
            @Valid
            @RequestBody
            CreateCategoryRequest request){

        return categoryService
                .createCategory(request);
    }

    @GetMapping("/api/categories/{id}")
    public Category getCategoryById(
            @PathVariable Long id){

        return categoryService
                .getCategoryById(id);
    }

    @PutMapping("/api/categories/{id}")
    public Category updateCategory(

            @PathVariable Long id,

            @Valid
            @RequestBody
            UpdateCategoryRequest request){

        return categoryService
                .updateCategory(
                        id,
                        request);
    }
    @DeleteMapping("/api/categories/{id}")
    public String deleteCategory(

            @PathVariable Long id){

        categoryService
                .deleteCategory(id);

        return "Category Deleted Successfully";
    }
}