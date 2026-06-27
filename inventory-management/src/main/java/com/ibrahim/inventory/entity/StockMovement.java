package com.ibrahim.inventory.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "stock_movement")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "type")
    private String type;

    private Integer quantity;

    private String note;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}