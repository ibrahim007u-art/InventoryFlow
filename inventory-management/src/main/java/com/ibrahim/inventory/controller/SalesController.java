package com.ibrahim.inventory.controller;

import com.ibrahim.inventory.dto.CreateSaleRequest;
import com.ibrahim.inventory.dto.SalesInvoiceResponse;
import com.ibrahim.inventory.service.SalesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SalesController {

    private final SalesService salesService;

    @PostMapping
    public SalesInvoiceResponse createSale(
            @Valid
            @RequestBody CreateSaleRequest request){

        return salesService
                .createSale(request);
    }

    @GetMapping
    public List<SalesInvoiceResponse> getAllInvoices(){

        return salesService
                .getAllInvoices();
    }

    @GetMapping("/{id}")
    public SalesInvoiceResponse getInvoiceById(
            @PathVariable Long id){

        return salesService
                .getInvoiceById(id);
    }
}