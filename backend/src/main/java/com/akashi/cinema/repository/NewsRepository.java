package com.akashi.cinema.repository;

import com.akashi.cinema.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRepository extends JpaRepository<News, Integer> {

    @Query("""
        SELECT n FROM News n
        WHERE (:keyword IS NULL OR :keyword = ''
           OR LOWER(n.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
           OR LOWER(n.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
        ORDER BY n.createdAt DESC, n.newsId DESC
    """)
    Page<News> searchNews(@Param("keyword") String keyword, Pageable pageable);
}
