package com.iman.investment.service;

import com.iman.investment.config.FileStorageConfig;
import com.iman.investment.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "ppt", "pptx", "doc", "docx", "png", "jpg", "jpeg", "gif", "webp", "mp4", "webm");

    private final FileStorageConfig fileStorageConfig;

    public String storeFile(MultipartFile file, String subDirectory) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        if (originalFilename.contains("..") || subDirectory.contains("..") || subDirectory.contains("/") && subDirectory.startsWith("/")) {
            throw new BadRequestException("Invalid file path");
        }
        String extension = extension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new BadRequestException("File type not allowed: " + extension);
        }
        String storedName = UUID.randomUUID() + "." + extension;
        try {
            Path targetDir = Paths.get(fileStorageConfig.getUploadPath(), subDirectory).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);
            Path targetLocation = targetDir.resolve(storedName).normalize();
            if (!targetLocation.startsWith(targetDir)) throw new BadRequestException("Invalid file path");
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return subDirectory + "/" + storedName;
        } catch (IOException ex) {
            throw new BadRequestException("Could not store file: " + originalFilename);
        }
    }

    public Path loadFile(String filePath) {
        if (filePath == null || filePath.isBlank()) throw new BadRequestException("File not found");
        Path root = Paths.get(fileStorageConfig.getUploadPath()).toAbsolutePath().normalize();
        Path path = root.resolve(filePath).normalize();
        if (!path.startsWith(root)) throw new BadRequestException("Invalid file path");
        if (!Files.exists(path)) {
            throw new BadRequestException("File not found");
        }
        return path;
    }

    public void deleteFile(String filePath) {
        try {
            Files.deleteIfExists(loadFile(filePath));
        } catch (IOException ex) {
            throw new BadRequestException("Could not delete file");
        }
    }

    public void validateDocument(MultipartFile file, Set<String> allowedExtensions, long maxBytes) {
        if (file == null || file.isEmpty()) throw new BadRequestException("File is empty");
        if (file.getSize() > maxBytes) throw new BadRequestException("File exceeds maximum size");
        String ext = extension(StringUtils.cleanPath(file.getOriginalFilename())).toLowerCase(Locale.ROOT);
        if (!allowedExtensions.contains(ext)) throw new BadRequestException("File type not allowed: " + ext);
        String contentType = file.getContentType();
        if (contentType == null || !(contentType.equals("application/pdf")
                || contentType.equals("application/msword")
                || contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equals("application/vnd.ms-powerpoint")
                || contentType.equals("application/vnd.openxmlformats-officedocument.presentationml.presentation"))) {
            throw new BadRequestException("Invalid document content type");
        }
    }

    public String extension(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex + 1) : "";
    }
}
