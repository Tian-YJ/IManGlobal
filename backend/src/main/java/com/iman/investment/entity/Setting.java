package com.iman.investment.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Setting extends BaseEntity {

    @Column(name = "setting_key", unique = true, nullable = false, length = 100)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;

    @Column(length = 255)
    private String description;

    @Column(length = 50)
    private String category;
}
