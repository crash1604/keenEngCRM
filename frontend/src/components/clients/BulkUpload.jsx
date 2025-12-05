import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { clientStore } from '../../stores/client.store';

const BulkUpload = ({ open, onClose, onSuccess, onError }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);

  const steps = ['Upload File', 'Validate Data', 'Review & Confirm', 'Complete'];

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setData(jsonData);
      validateData(jsonData);
    };

    reader.readAsArrayBuffer(file);
    setActiveStep(1);
  };

  const validateData = (data) => {
    const errors = [];
    
    data.forEach((row, index) => {
      // Required fields
      if (!row.name) {
        errors.push(`Row ${index + 2}: Name is required`);
      }
      
      // Email validation
      if (row.contact_email && !isValidEmail(row.contact_email)) {
        errors.push(`Row ${index + 2}: Invalid email format`);
      }
      
      // Phone validation
      if (row.phone && !isValidPhone(row.phone)) {
        errors.push(`Row ${index + 2}: Invalid phone format`);
      }
    });
    
    setValidationErrors(errors);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone);
  };

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      setActiveStep(1); // Go back to validation step
      return;
    }

    setUploading(true);
    setActiveStep(2);

    try {
      const result = await clientStore.bulkCreateClients(data);
      setUploadResult(result);
      setActiveStep(3);
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      setUploadErrors([error.message || 'Upload failed']);
      if (onError) {
        onError(error.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setData([]);
    setValidationErrors([]);
    setUploading(false);
    setUploadResult(null);
    setUploadErrors([]);
    setActiveStep(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const downloadTemplate = () => {
    const template = [
      {
        name: 'John Doe',
        company_name: 'Example Corp',
        contact_email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, City',
        contact_person: 'Jane Smith',
        billing_address: '123 Main St, City',
        notes: 'Important client',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    XLSX.writeFile(workbook, 'client_upload_template.xlsx');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Bulk Upload Clients</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload an Excel file (.xlsx, .xls) or CSV file containing client data.
              <Button 
                onClick={downloadTemplate} 
                startIcon={<DownloadIcon />}
                sx={{ ml: 2 }}
                size="small"
              >
                Download Template
              </Button>
            </Alert>
            
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Click to upload or drag and drop
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Excel (.xlsx, .xls) or CSV files only
              </Typography>
              {file && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {file.name}
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {activeStep === 1 && data.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Found {data.length} records to import
            </Typography>
            
            {validationErrors.length > 0 ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Found {validationErrors.length} validation errors:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>
                      <Typography variant="body2">
                        ... and {validationErrors.length - 5} more errors
                      </Typography>
                    </li>
                  )}
                </Box>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                All data validated successfully!
              </Alert>
            )}

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.company_name || '-'}</TableCell>
                      <TableCell>{row.contact_email || '-'}</TableCell>
                      <TableCell>{row.phone || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {data.length > 5 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body2" color="text.secondary">
                          ... and {data.length - 5} more records
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            {uploading ? (
              <Box display="flex" flexDirection="column" alignItems="center" p={4}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="body1">
                  Uploading {data.length} clients...
                </Typography>
              </Box>
            ) : (
              <Alert severity="warning">
                Are you sure you want to upload {data.length} clients?
                This action cannot be undone.
              </Alert>
            )}
          </Box>
        )}

        {activeStep === 3 && uploadResult && (
          <Box>
            <Alert 
              severity={uploadResult.errors && uploadResult.errors.length > 0 ? 'warning' : 'success'}
              sx={{ mb: 2 }}
            >
              {uploadResult.errors && uploadResult.errors.length > 0 ? (
                <>
                  <Typography variant="subtitle2">
                    Upload completed with {uploadResult.errors.length} error(s)
                  </Typography>
                  <Typography variant="body2">
                    Successfully created {uploadResult.successCount || 0} clients
                  </Typography>
                </>
              ) : (
                <Typography variant="subtitle2">
                  Successfully uploaded {uploadResult.successCount || data.length} clients!
                </Typography>
              )}
            </Alert>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Errors:
                </Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row || 'N/A'}</TableCell>
                          <TableCell>{error.message || 'Unknown error'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {activeStep < 3 && (
          <Button onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
        )}
        
        {activeStep === 0 && (
          <Button 
            variant="contained" 
            onClick={() => document.getElementById('file-upload').click()}
            startIcon={<CloudUploadIcon />}
          >
            Upload File
          </Button>
        )}
        
        {activeStep === 1 && (
          <>
            <Button onClick={() => setActiveStep(0)} disabled={uploading}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={validationErrors.length > 0 || uploading}
              startIcon={uploading ? <CircularProgress size={20} /> : null}
            >
              {validationErrors.length > 0 ? 'Fix Errors First' : 'Proceed to Upload'}
            </Button>
          </>
        )}
        
        {activeStep === 2 && !uploading && (
          <>
            <Button onClick={() => setActiveStep(1)}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              startIcon={<CloudUploadIcon />}
            >
              Confirm Upload
            </Button>
          </>
        )}
        
        {activeStep === 3 && (
          <Button 
            variant="contained" 
            onClick={handleClose}
          >
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkUpload;