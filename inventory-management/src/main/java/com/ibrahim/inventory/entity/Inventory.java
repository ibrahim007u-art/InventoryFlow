package com.ibrahim.inventory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "inventory")
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({
            "createdAt",
            "updatedAt"
    })
    private Product product;

    private Integer quantity;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}