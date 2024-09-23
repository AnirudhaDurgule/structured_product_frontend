import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { read, utils } from 'xlsx';
import Navbar from './Navbar';
import axios from 'axios';
import './App.css';

const Maker = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState({
    AlloteeMaster: null,
    ISINMaster: null,
    OptionMaster1: null,
    ProductSpecification: null,
    ProductMaster: null,
  });

  const initialStatuses = {
    AlloteeMaster: localStorage.getItem('AlloteeMasterStatus') || 'pending',
    ISINMaster: localStorage.getItem('ISINMasterStatus') || 'pending',
    OptionMaster1: localStorage.getItem('OptionMaster1Status') || 'pending',
    ProductSpecification: localStorage.getItem('ProductSpecificationStatus') || 'pending',
    ProductMaster: localStorage.getItem('ProductMasterStatus') || 'pending',
  };

  const initialDisabledSubmit = {
    AlloteeMaster: initialStatuses.AlloteeMaster === 'approved' || initialStatuses.AlloteeMaster === 'pending',
    ISINMaster: initialStatuses.ISINMaster === 'approved' || initialStatuses.ISINMaster === 'pending',
    OptionMaster1: initialStatuses.OptionMaster1 === 'approved' || initialStatuses.OptionMaster1 === 'pending',
    ProductSpecification: initialStatuses.ProductSpecification === 'approved' || initialStatuses.ProductSpecification === 'pending',
    ProductMaster: initialStatuses.ProductMaster === 'approved' || initialStatuses.ProductMaster === 'pending',
  };

  const [statuses, setStatuses] = useState(initialStatuses);
  const [disabledSubmit, setDisabledSubmit] = useState(initialDisabledSubmit);
  const [isLoading, setIsLoading] = useState(false);
  const allowedFiles = {
    AlloteeMaster: 'Allotee Master.xlsx',
    ISINMaster: 'ISIN Master.xlsx',
    OptionMaster1: 'Option Master1.xlsx',
    ProductSpecification: 'Product Specification.xlsx',
    ProductMaster: 'Product Master.xlsx'
  };

  const apiEndpoints = {
    AlloteeMaster: 'http://172.16.47.87:8000/service/add_allotee_data_from_excel',
    ISINMaster: 'http://172.16.47.87:8000/service/add_isinmaster_data_from_excel',
    OptionMaster1: 'http://172.16.47.87:8000/service/add_option_data_from_excel',
    ProductSpecification: 'http://172.16.47.87:8000/service/add_product_specification_from_excel',
    ProductMaster: 'http://172.16.47.87:8000/service/add_product_data_from_excel'
  };

  const statusEndpoints = {
    AlloteeMaster: 'http://172.16.47.87:8000/service/allotee_status',
    ISINMaster: 'http://172.16.47.87:8000/service/isin_status',
    OptionMaster1: 'http://172.16.47.87:8000/service/opt_master_status',
    ProductSpecification: 'http://172.16.47.87:8000/service/pro_spec_status',
    ProductMaster: 'http://172.16.47.87:8000/service/pro_master_status'
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const selectedFile = files && files[0];

    if (selectedFile && selectedFile.name !== allowedFiles[name]) {
      window.alert(`Only ${allowedFiles[name]} is allowed for this field.`);
      return;
    }

    setFiles((prevFiles) => ({
      ...prevFiles,
      [name]: selectedFile,
    }));
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const wb = read(event.target.result, { type: 'array' });
        const sheets = wb.SheetNames;
        if (sheets && sheets.length) {
          const rows = utils.sheet_to_json(wb.Sheets[sheets[0]], { header: 1 });
        }
      } catch (error) {
        console.error('Error reading file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadFileAPI = async (fileKey, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', localStorage.getItem('user_id'));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiEndpoints[fileKey], {
        method: 'POST',
        headers: {
          "Auth-Token": token,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      return response.json();
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Failed to upload file');
    }
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
      } else if (response.data.status === 'failure') {
        return 'No data found for today';
      } else {
      return 'No File Uploaded Yet!!!';
      }
    } catch (error) {
      return 'No data found for today';
    }
  };

  const handleSubmit = async (e, fileKey) => {
    e.preventDefault();
    const file = files[fileKey];

    if (!file || file.name !== allowedFiles[fileKey]) {
      window.alert(`Only ${allowedFiles[fileKey]} is allowed for this field.`);
      return;
    }

    if (file) {
      try {
        setIsLoading(true);
        await uploadFileAPI(fileKey, file);
        handleImport(file);
        window.alert(`${fileKey} uploaded successfully`);
        setStatuses((prevStatuses) => ({
          ...prevStatuses,
          [fileKey]: 'pending',
        }));
        setDisabledSubmit((prevDisabled) => ({
          ...prevDisabled,
          [fileKey]: true,
        }));
        localStorage.setItem(`${fileKey}Status`, 'pending');
      } catch (error) {
        console.error('Error uploading file:', error);
        window.alert(`Failed to upload ${fileKey}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      window.alert(`No file selected for ${fileKey}`);
    }
  };

  const handleCombinedSubmit = async (e) => {
    e.preventDefault();

    const fileKeys = ['AlloteeMaster', 'ISINMaster', 'ProductSpecification', 'OptionMaster1'];
    const selectedFiles = fileKeys.map(fileKey => files[fileKey]);

    if (selectedFiles.some(file => !file)) {
      window.alert('Please select all required files.');
      return;
    }

    try {
      setIsLoading(true);
      for (const fileKey of fileKeys) {
        await uploadFileAPI(fileKey, files[fileKey]);
        handleImport(files[fileKey]);
        setStatuses((prevStatuses) => ({
          ...prevStatuses,
          [fileKey]: 'pending',
        }));
        setDisabledSubmit((prevDisabled) => ({
          ...prevDisabled,
          [fileKey]: true,
        }));
        localStorage.setItem(`${fileKey}Status`, 'pending');
      }
      window.alert('All files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      window.alert('Failed to upload files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'Maker') {
      navigate('/signin');
    }

    let index = 0;
    const keys = Object.keys(files);

    const interval = setInterval(async () => {
      const fileKey = keys[index];
      const status = await getStatus(fileKey);
      setStatuses((prevStatuses) => ({
        ...prevStatuses,
        [fileKey]: status,
      }));
      localStorage.setItem(`${fileKey}Status`, status);
      if (status === 'rejected' || status === 'No data found for today') {
        setDisabledSubmit((prevDisabled) => ({
          ...prevDisabled,
          [fileKey]: false,
        }));
      } else if (status === 'approved') {
        setDisabledSubmit((prevDisabled) => ({
          ...prevDisabled,
          [fileKey]: true,
        }));
      }
      index = (index + 1) % keys.length;
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, files]);

  const isSubmitAllDisabled = ['AlloteeMaster', 'ISINMaster', 'OptionMaster1', 'ProductSpecification'].every(
    (fileKey) => statuses[fileKey] === 'pending'
  );

  return (
    <div className="App">
      <Navbar />
      <br/><br/><br/><br/>
      <div className="upload-form-horizontal">
        <h1>Maker Page</h1>
        <h2>Upload Files</h2>
        <div className="forms-container">
        {isLoading && <div className="loader">
    <div className="dot"></div>
    <div className="dot"></div>
    <div className="dot"></div>
</div>}
          <form onSubmit={handleCombinedSubmit} className="form-style">
            <div className="form-group">
              <label>Allotee Master.xlsx</label>
              <input
                type="file"
                name="AlloteeMaster"
                onChange={handleFileChange}
                accept=".xlsx"
                required
              />
              <div className="status-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {statuses.AlloteeMaster}</div>
              <br/>
            </div>
            <div>
              <label>ISIN Master.xlsx</label>
              <input
                type="file"
                name="ISINMaster"
                onChange={handleFileChange}
                accept=".xlsx"
                required
              />
              <div className="status-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {statuses.ISINMaster}</div>
              <br/>
            </div>
            <div>
              <label>Option Master1.xlsx</label>
              <input
                type="file"
                name="OptionMaster1"
                onChange={handleFileChange}
                accept=".xlsx"
                required
              />
              <div className="status-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {statuses.OptionMaster1}</div>
              <br/>
            </div>
            <div>
              <label>Product Specification.xlsx</label>
              <input
                type="file"
                name="ProductSpecification"
                onChange={handleFileChange}
                accept=".xlsx"
                required
              />
              <div className="status-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {statuses.ProductSpecification}</div>
              <br/>
            </div>
            <button
              type="submit"
              className={isSubmitAllDisabled ? 'disabled-button' : ''}
              disabled={isSubmitAllDisabled}
            >
              Submit All
            </button>
          </form>
          <form onSubmit={(e) => handleSubmit(e, 'ProductMaster')}>
            <div>
              <label>Product Master.xlsx</label>
              <input
                type="file"
                name="ProductMaster"
                onChange={handleFileChange}
                accept=".xlsx"
                required
              />
              <button
                type="submit"
                className={disabledSubmit.ProductMaster ? 'disabled-button' : ''}
                disabled={disabledSubmit.ProductMaster}
              >
                Submit
              </button>
              <div className="status-text">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Status: {statuses.ProductMaster}</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Maker;
