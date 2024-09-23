import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import axios from 'axios';
import './App.css';
import { toast, ToastContainer } from 'react-toastify';

const Checker = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState({
    "Allotee Master": false,
    "ISIN Master": false,
    "Option Master1": false,
    "Product Specification": false,
    "Product Master": false,
  });
  const [fileStatus, setFileStatus] = useState({
    "Allotee Master": "Loading...",
    "ISIN Master": "Loading...",
    "Option Master1": "Loading...",
    "Product Specification": "Loading...",
    "Product Master": "Loading...",
  });
  const [actionDisabled, setActionDisabled] = useState({
    "Allotee Master": true,
    "ISIN Master": true,
    "Option Master1": true,
    "Product Specification": true,
    "Product Master": true,
  });

  const statusEndpoints = {
    "Allotee Master": 'http://172.16.47.87:8000/service/allotee_status',
    "ISIN Master": 'http://172.16.47.87:8000/service/isin_status',
    "Option Master1": 'http://172.16.47.87:8000/service/opt_master_status',
    "Product Specification": 'http://172.16.47.87:8000/service/pro_spec_status',
    "Product Master": 'http://172.16.47.87:8000/service/pro_master_status'
  };

  const getStatus = async (fileKey) => {
    try {
      const response = await axios.get(statusEndpoints[fileKey], {
        headers: {
          "Auth-Token": localStorage.getItem('token'),
        }
      });

      if (response.data.status === 'success') {
        return response.data.data.status;
      }
      return 'No File Uploaded Yet!!!';
    } catch (error) {
      return 'No data found for today';
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://172.16.47.87:8000/service/download/${fileName}`, {
        headers: {
          "Auth-Token": token,
        },
        responseType: 'blob',
      });

      const updatedFileKey = fileName.replace('.xlsx', '');

      if (response.status === 404 || response.data.error === "File not found") {
        toast.error("File not found");

        setSelectedFiles((prevStatus) => ({
          ...prevStatus,
          [updatedFileKey]: false,
        }));
        setFileStatus((prevStatus) => ({
          ...prevStatus,
          [updatedFileKey]: true,
        }));
        setActionDisabled((prevDisabled) => ({
          ...prevDisabled,
          [updatedFileKey]: true,
        }));
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFileStatus((prevStatus) => ({
        ...prevStatus,
        [updatedFileKey]: false,
      }));
      setActionDisabled((prevDisabled) => ({
        ...prevDisabled,
        [updatedFileKey]: false,
      }));
    } catch (error) {
      console.error('Error downloading file:', error);
      window.alert('File has not been uploaded by Maker');
    }
  };

  const handleAction = async (fileName, action) => {
    try {
      const token = localStorage.getItem('token');
      const status = action === 'approve' ? 'approved' : 'rejected';
      const endpointMap = {
        "Allotee Master": "/update_allotee_status",
        "ISIN Master": "/update_isin_status",
        "Option Master1": "/update_opt_master_status",
        "Product Specification": "/update_pro_spec_status",
        "Product Master": "/update_pro_master_status",
      };
      const endpoint = endpointMap[fileName];

      const response = await axios.post(
        `http://172.16.47.87:8000/service${endpoint}`,
        new URLSearchParams({ status }),
        {
          headers: {
            "Auth-Token": token,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.status === 'success') {
        window.alert(`Successfully ${status} ${fileName}`);
        setSelectedFiles((prevSelectedFiles) => ({
          ...prevSelectedFiles,
          [fileName]: action === 'approve',
        }));
        setActionDisabled((prevDisabled) => ({
          ...prevDisabled,
          [fileName]: true,
        }));
      } else {
        window.alert(`Failed to ${status} ${fileName}: ${response.data.message}`);
      }
    } catch (error) {
      console.error(`Error in ${action} action for ${fileName}:`, error);
      window.alert(`Error in ${action} action for ${fileName}`);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Checker') {
      navigate('/signin');
    }

    const fetchStatuses = async () => {
      const statuses = {};
      for (const fileKey of Object.keys(statusEndpoints)) {
        statuses[fileKey] = await getStatus(fileKey);
      }
      setFileStatus(statuses);
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="App">
      <Navbar />
      <ToastContainer />
      <br/><br/>
      <div className="checker-buttons">
        <h2>Checker Page</h2>
        <div className="file-buttons">
          {Object.keys(selectedFiles).map((fileKey) => (
            <div key={fileKey} className={`file-button ${selectedFiles[fileKey] ? 'selected' : ''}`}>
              <button
                onClick={() => handleDownload(`${fileKey}.xlsx`)}
                disabled={fileStatus[fileKey] === 'No File Uploaded Yet!!!'}
              >
                Download {fileKey.replace(/([A-Z])/g, ' $1').trim()}.xlsx
              </button>
              <div className="action-buttons">
                <button
                  className="approve"
                  onClick={() => handleAction(fileKey, 'approve')}
                  disabled={actionDisabled[fileKey]}
                >
                  Approve
                </button>
                <button
                  className="reject"
                  onClick={() => handleAction(fileKey, 'reject')}
                  disabled={actionDisabled[fileKey]}
                >
                  Reject
                </button>
              </div>
              <div className="status-text">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {fileStatus[fileKey]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Checker;
