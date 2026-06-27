package com.ibrahim.inventory.repository;

import com.ibrahim.inventory.entity.SalesInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalesInvoiceRepository
        extends JpaRepository<SalesInvoice, Long> {
}