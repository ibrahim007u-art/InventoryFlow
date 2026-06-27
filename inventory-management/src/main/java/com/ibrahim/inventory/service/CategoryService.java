package com.ibrahim.inventory.service;

import com.ibrahim.inventory.dto.CreateCategoryRequest;
import com.ibrahim.inventory.dto.UpdateCategoryRequest;
import com.ibrahim.inventory.entity.Category;
import com.ibrahim.inventory.exception.ResourceNotFoundException;
import com.ibrahim.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(
            CategoryRepository categoryRepository) {

        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAllCategories() {

        return categoryRepository.findAll();
    }

    public Category createCategory(
            CreateCategoryRequest request) {

        Category category = new Category();

        category.setName(
                request.getName());

        category.setDescription(
                request.getDescription());

        category.setCreatedAt(
                LocalDateTime.now());

        category.setUpdatedAt(
                LocalDateTime.now());

        return categoryRepository.save(
                category);
    }

    public Category getCategoryById(Long id) {

        return categoryRepository
                .findById(id)
                .orElseThrow(
                        () -> new ResourceNotFoundException(
                                "Category Not Found"));
    }

    public Category updateCategory(
            Long id,
            UpdateCategoryRequest request) {

        Category category =
                categoryRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Category Not Found"));

        category.setName(
                request.getName());

        category.setDescription(
                request.getDescription());

        category.setUpdatedAt(
                LocalDateTime.now());

        return categoryRepository
                .save(category);
    }

    public void deleteCategory(Long id) {

        Category category =
                categoryRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Category Not Found"));

        categoryRepository.delete(
                category);
    }

}