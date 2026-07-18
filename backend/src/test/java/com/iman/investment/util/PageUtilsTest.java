package com.iman.investment.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PageUtilsTest {
    @Test
    void clampsPagingAndRejectsUnknownSortProperties() {
        var pageable = PageUtils.createPageable(-2, 500, "password", "desc");

        assertThat(pageable.getPageNumber()).isZero();
        assertThat(pageable.getPageSize()).isEqualTo(100);
        assertThat(pageable.getSort().getOrderFor("createdAt")).isNotNull();
        assertThat(pageable.getSort().getOrderFor("createdAt").isDescending()).isTrue();
    }
}
