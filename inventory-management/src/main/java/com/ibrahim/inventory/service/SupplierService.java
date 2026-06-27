package com.ibrahim.inventory.service;

import com.ibrahim.inventory.entity.Supplier;
import com.ibrahim.inventory.exception.ResourceNotFoundException;
import com.ibrahim.inventory.repository.SupplierRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    // GET ALL
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    // GET BY ID
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Supplier Not Found"));
    }

    // CREATE
    public Supplier createSupplier(Supplier supplier) {

        supplier.setCreatedAt(LocalDateTime.now());
        supplier.setUpdatedAt(LocalDateTime.now());

        return supplierRepository.save(supplier);
    }

    // UPDATE
    public Supplier updateSupplier(Long id, Supplier request) {

        Supplier supplier = getSupplierById(id);

        supplier.setName(request.getName());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        supplier.setUpdatedAt(LocalDateTime.now());

        return supplierRepository.save(supplier);
    }

    // DELETE
    public void deleteSupplier(Long id) {

        Supplier supplier = getSupplierById(id);
        supplierRepository.delete(supplier);
    }
}