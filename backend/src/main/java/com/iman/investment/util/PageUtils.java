package com.iman.investment.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

public final class PageUtils {
    private static final java.util.Set<String> ALLOWED_SORTS = java.util.Set.of(
            "createdAt", "updatedAt", "title", "name", "fullName", "email", "companyName",
            "founderName", "status", "displayOrder", "publishedDate", "datePosted", "firstName", "lastName", "key");

    private PageUtils() {}

    public static Pageable createPageable(int page, int size, String sortBy, String direction) {
        String property = ALLOWED_SORTS.contains(sortBy) ? sortBy : "createdAt";
        Sort sort = Sort.by("desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC,
                property);
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), sort);
    }
}
