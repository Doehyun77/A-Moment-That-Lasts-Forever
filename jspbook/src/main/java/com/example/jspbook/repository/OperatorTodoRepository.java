package com.example.jspbook.repository;

import com.example.jspbook.entity.OperatorTodo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperatorTodoRepository extends JpaRepository<OperatorTodo, Long> {
    List<OperatorTodo> findAllByOrderBySortOrderAscIdAsc();
}
