package com.iman.investment.service;

import com.iman.investment.config.FileStorageConfig;
import com.iman.investment.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FileStorageServiceTest {
    @TempDir Path temp;

    @Test
    void storesValidatedDocumentInsideConfiguredRoot() {
        FileStorageConfig config = mock(FileStorageConfig.class);
        when(config.getUploadPath()).thenReturn(temp.toString());
        FileStorageService service = new FileStorageService(config);
        MockMultipartFile file = new MockMultipartFile("file", "plan.pdf", "application/pdf", "%PDF-test".getBytes());

        service.validateDocument(file, Set.of("pdf"), 1024);
        String stored = service.storeFile(file, "plans");

        assertThat(stored).startsWith("plans/").endsWith(".pdf");
        assertThat(service.loadFile(stored)).exists().startsWith(temp);
    }

    @Test
    void rejectsTraversalAndDisallowedDocuments() {
        FileStorageConfig config = mock(FileStorageConfig.class);
        when(config.getUploadPath()).thenReturn(temp.toString());
        FileStorageService service = new FileStorageService(config);
        MockMultipartFile executable = new MockMultipartFile("file", "../payload.exe",
                "application/octet-stream", new byte[]{1});

        assertThatThrownBy(() -> service.storeFile(executable, "media")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.loadFile("../secret")).isInstanceOf(BadRequestException.class);
    }
}
