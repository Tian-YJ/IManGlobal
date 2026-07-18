package com.iman.investment.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
public class FileStorageConfig {

    @Value("${iman.upload.path}")
    private String uploadPath;
}
