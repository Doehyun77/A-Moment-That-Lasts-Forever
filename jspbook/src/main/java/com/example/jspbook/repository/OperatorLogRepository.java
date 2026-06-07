package com.example.jspbook.repository;

import com.example.jspbook.entity.OperatorLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OperatorLogRepository extends JpaRepository<OperatorLog, Long> {
    List<OperatorLog> findAllByOrderByCreatedAtDescIdDesc();
}
