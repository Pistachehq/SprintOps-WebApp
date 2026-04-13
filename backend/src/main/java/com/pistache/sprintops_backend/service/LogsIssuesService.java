package com.pistache.sprintops_backend.service;

import com.pistache.sprintops_backend.model.LogsIssues;
import com.pistache.sprintops_backend.model.Issues;
import com.pistache.sprintops_backend.repository.LogsIssuesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class LogsIssuesService {

    @Autowired
    private LogsIssuesRepository logsIssuesRepository;

    public List<LogsIssues> findAll() {
        return logsIssuesRepository.findAll();
    }

    public Optional<LogsIssues> findById(Integer id) {
        return logsIssuesRepository.findById(id);
    }

    public List<LogsIssues> findByIssue(Issues issue) {
        return logsIssuesRepository.findByIssue(issue);
    }

    public List<LogsIssues> findByIssueId(Integer issueId) {
        return logsIssuesRepository.findByIssueIdIssue(issueId);
    }

    public List<LogsIssues> findByTipoAccion(String tipoAccion) {
        return logsIssuesRepository.findByTipoAccion(tipoAccion);
    }

    public LogsIssues save(LogsIssues logsIssues) {
        return logsIssuesRepository.save(logsIssues);
    }

    public void deleteById(Integer id) {
        logsIssuesRepository.deleteById(id);
    }

    public boolean existsById(Integer id) {
        return logsIssuesRepository.existsById(id);
    }
}
