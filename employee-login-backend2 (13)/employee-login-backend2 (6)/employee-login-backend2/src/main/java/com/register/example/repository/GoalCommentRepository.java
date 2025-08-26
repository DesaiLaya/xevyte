package com.register.example.repository;

import com.register.example.entity.GoalComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoalCommentRepository extends JpaRepository<GoalComment, Long> {
    List<GoalComment> findByGoal_GoalId(Long goalId);
}
