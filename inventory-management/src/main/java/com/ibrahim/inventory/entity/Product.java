package com.ibrahim.inventory.entity;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="product")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable=false, unique=true)
    private String sku;

    @Column(nullable=false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable=false)
    private Integer minimumStock;

    @ManyToOne
    @JoinColumn(name="category_id")
    @JsonIgnoreProperties({
            "createdAt",
            "updatedAt",
            "description"
    })
    private Category category;

    @ManyToOne
    @JoinColumn(name="supplier_id")
    @JsonIgnoreProperties({
            "createdAt",
            "updatedAt",
            "address",
            "email",
            "phone"
    })
    private Supplier supplier;


    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;
}