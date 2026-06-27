package com.ibrahim.inventory.service;

import com.ibrahim.inventory.dto.CreateSaleRequest;
import com.ibrahim.inventory.dto.SalesInvoiceResponse;
import com.ibrahim.inventory.repository.InventoryRepository;
import com.ibrahim.inventory.repository.ProductRepository;
import com.ibrahim.inventory.repository.SalesInvoiceItemRepository;
import com.ibrahim.inventory.repository.SalesInvoiceRepository;
import com.ibrahim.inventory.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.ibrahim.inventory.dto.SaleItemRequest;
import com.ibrahim.inventory.dto.SalesInvoiceItemResponse;
import com.ibrahim.inventory.entity.Inventory;
import com.ibrahim.inventory.entity.Product;
import com.ibrahim.inventory.entity.SalesInvoice;
import com.ibrahim.inventory.entity.SalesInvoiceItem;
import com.ibrahim.inventory.entity.StockMovement;
import com.ibrahim.inventory.exception.InsufficientStockException;
import com.ibrahim.inventory.exception.ResourceNotFoundException;

import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesService {

    private final SalesInvoiceRepository salesInvoiceRepository;

    private final SalesInvoiceItemRepository salesInvoiceItemRepository;

    private final ProductRepository productRepository;

    private final InventoryRepository inventoryRepository;

    private final StockMovementRepository stockMovementRepository;

    public SalesInvoiceResponse createSale(
            CreateSaleRequest request){

        SalesInvoice invoice =
                new SalesInvoice();

        invoice.setInvoiceNumber(
                "TEMP");

        invoice.setCustomerName(
                request.getCustomerName());

        invoice.setCreatedAt(
                LocalDateTime.now());

        invoice.setTotalAmount(
                BigDecimal.ZERO);

        SalesInvoice savedInvoice =
                salesInvoiceRepository.save(invoice);

        savedInvoice.setInvoiceNumber(
                "INV-" + savedInvoice.getId());

        salesInvoiceRepository.save(savedInvoice);

        BigDecimal totalAmount =
                BigDecimal.ZERO;

        List<SalesInvoiceItemResponse> itemResponses =
                new ArrayList<>();

        for(SaleItemRequest itemRequest : request.getItems()){

            Product product =
                    productRepository
                            .findById(itemRequest.getProductId())
                            .orElseThrow(
                                    () -> new ResourceNotFoundException(
                                            "Product Not Found"));

            Inventory inventory =
                    inventoryRepository
                            .findAll()
                            .stream()
                            .filter(inv ->
                                    inv.getProduct()
                                            .getId()
                                            .equals(product.getId()))
                            .findFirst()
                            .orElseThrow(
                                    () -> new ResourceNotFoundException(
                                            "Inventory Not Found"));

            if(inventory.getQuantity()
                    < itemRequest.getQuantity()){

                throw new InsufficientStockException(
                        "Insufficient Stock");
            }

            BigDecimal lineTotal =
                    product.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(
                                            itemRequest.getQuantity()));

            totalAmount =
                    totalAmount.add(lineTotal);

            SalesInvoiceItem invoiceItem =
                    new SalesInvoiceItem();

            invoiceItem.setInvoice(savedInvoice);
            invoiceItem.setProduct(product);
            invoiceItem.setQuantity(itemRequest.getQuantity());
            invoiceItem.setUnitPrice(product.getPrice());
            invoiceItem.setLineTotal(lineTotal);

            salesInvoiceItemRepository.save(invoiceItem);

            inventory.setQuantity(
                    inventory.getQuantity()
                            - itemRequest.getQuantity());

            inventory.setUpdatedAt(LocalDateTime.now());

            inventoryRepository.save(inventory);

            StockMovement movement =
                    new StockMovement();

            movement.setProduct(product);
            movement.setType("OUT");
            movement.setQuantity(itemRequest.getQuantity());
            movement.setNote("Product Sold - " + savedInvoice.getInvoiceNumber());
            movement.setMovementDate(LocalDateTime.now());
            movement.setCreatedAt(LocalDateTime.now());

            stockMovementRepository.save(movement);

            SalesInvoiceItemResponse itemResponse =
                    new SalesInvoiceItemResponse();

            itemResponse.setProductName(product.getName());
            itemResponse.setQuantity(itemRequest.getQuantity());
            itemResponse.setUnitPrice(product.getPrice());
            itemResponse.setLineTotal(lineTotal);

            itemResponses.add(itemResponse);
        }

        savedInvoice.setTotalAmount(totalAmount);

        salesInvoiceRepository.save(savedInvoice);

        SalesInvoiceResponse response =
                new SalesInvoiceResponse();

        response.setInvoiceId(savedInvoice.getId());
        response.setInvoiceNumber(savedInvoice.getInvoiceNumber());
        response.setCustomerName(savedInvoice.getCustomerName());
        response.setCreatedAt(savedInvoice.getCreatedAt());
        response.setItems(itemResponses);
        response.setTotalAmount(totalAmount);

        return response;


    }

    public List<SalesInvoiceResponse> getAllInvoices(){

        return salesInvoiceRepository
                .findAll()
                .stream()
                .map(invoice -> {

                    List<SalesInvoiceItemResponse> itemResponses =
                            salesInvoiceItemRepository
                                    .findByInvoiceId(invoice.getId())
                                    .stream()
                                    .map(item -> {

                                        SalesInvoiceItemResponse itemResponse =
                                                new SalesInvoiceItemResponse();

                                        itemResponse.setProductName(
                                                item.getProduct().getName());

                                        itemResponse.setQuantity(
                                                item.getQuantity());

                                        itemResponse.setUnitPrice(
                                                item.getUnitPrice());

                                        itemResponse.setLineTotal(
                                                item.getLineTotal());

                                        return itemResponse;
                                    })
                                    .collect(Collectors.toList());

                    SalesInvoiceResponse response =
                            new SalesInvoiceResponse();

                    response.setInvoiceId(invoice.getId());
                    response.setInvoiceNumber(invoice.getInvoiceNumber());
                    response.setCustomerName(invoice.getCustomerName());
                    response.setCreatedAt(invoice.getCreatedAt());
                    response.setItems(itemResponses);
                    response.setTotalAmount(invoice.getTotalAmount());

                    return response;
                })
                .collect(Collectors.toList());
    }
    //GET Invoice By ID
    public SalesInvoiceResponse getInvoiceById(Long id){

        SalesInvoice invoice =
                salesInvoiceRepository
                        .findById(id)
                        .orElseThrow(
                                () -> new ResourceNotFoundException(
                                        "Invoice Not Found"));

        List<SalesInvoiceItemResponse> itemResponses =
                salesInvoiceItemRepository
                        .findByInvoiceId(invoice.getId())
                        .stream()
                        .map(item -> {

                            SalesInvoiceItemResponse itemResponse =
                                    new SalesInvoiceItemResponse();

                            itemResponse.setProductName(
                                    item.getProduct().getName());

                            itemResponse.setQuantity(
                                    item.getQuantity());

                            itemResponse.setUnitPrice(
                                    item.getUnitPrice());

                            itemResponse.setLineTotal(
                                    item.getLineTotal());

                            return itemResponse;
                        })
                        .collect(Collectors.toList());

        SalesInvoiceResponse response =
                new SalesInvoiceResponse();

        response.setInvoiceId(invoice.getId());
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setCustomerName(invoice.getCustomerName());
        response.setCreatedAt(invoice.getCreatedAt());
        response.setItems(itemResponses);
        response.setTotalAmount(invoice.getTotalAmount());

        return response;
    }

}