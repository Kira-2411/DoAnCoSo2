package com.akashi.cinema.controller;

import com.akashi.cinema.dto.response.UploadSignatureResponse;
import com.akashi.cinema.service.CloudinaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final CloudinaryService cloudinaryService;

    public UploadController(CloudinaryService cloudinaryService) {
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/signature")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UploadSignatureResponse> generateSignature() {
        UploadSignatureResponse response = cloudinaryService.generateSignature();
        return ResponseEntity.ok(response);
    }
}
