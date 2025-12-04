import React, { useState, useEffect } from 'react';
import MsmeSidebar from './MsmeSidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../components/NotificationProvider';
import { validateForm, checkProductCompletion } from '../utils/validation';
import ValidationMessage from '../components/ValidationMessage';
import '../css/MsmeManageProduct.css';
import shakshoukaImg from '../assets/shakshouka.jpg';
import logoImage from '../logos/Icon on bright.png';

const MsmeManageProduct = () => {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useNotification();

  // Helper function to generate proper URLs for images
  const getImageUrl = (imageValue) => {
    if (!imageValue) return null;
    
    // If it's already a full URL (Cloudinary or other), use it directly
    if (imageValue.startsWith('http')) {
      return imageValue;
    }
    
    // If it contains folder structure like 'elako/products/...', it's a Cloudinary public ID
    if (imageValue.includes('/') && !imageValue.startsWith('uploads/')) {
      return `https://res.cloudinary.com/dk9umulxw/image/upload/${imageValue}`;
    }
    
    // Otherwise, it's a legacy local file
    return `http://localhost:1337/uploads/${imageValue}`;
  };
  
  // Debug log to check if showConfirm is available
  console.log('Notification functions available:', { showSuccess, showError, showConfirm });
  
  const [sidebarState, setSidebarState] = useState({ isOpen: true, isMobile: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    description: '',
    availability: true,
    pictures: [], // Changed from single picture to multiple pictures
    hashtags: '',
    category: '',
    artistName: '', // New field for artist name
    // New fields for enhanced product management
    variants: [], // For flavors/types (spicy, cheese, etc.)
    sizeOptions: [], // For beverage sizes (grams, ml, etc.)
    selectedVariant: 0 // Currently selected variant for image display
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagList, setHashtagList] = useState([]);
  
  // New states for enhanced features
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Track existing images from server
  const [currentVariant, setCurrentVariant] = useState({ name: '', price: '' });
  const [currentSize, setCurrentSize] = useState({ size: '', unit: 'ml', price: '' });
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [showSizeForm, setShowSizeForm] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editingVariantData, setEditingVariantData] = useState({ name: '', price: '' });

  // Fetch products on component mount
  useEffect(() => {
    if (user && user._id) {
      fetchProducts();
    }
  }, [user]);

  // Get categories based on user's business type
  const getCategories = () => {
    if (user?.category === 'food') {
      return [
        { value: 'processed-foods', label: 'Processed Foods' },
        { value: 'baked-goods', label: 'Baked Goods' },
        { value: 'beverages', label: 'Beverages' },
        { value: 'confectionery', label: 'Confectionery' }
      ];
    } else if (user?.category === 'artisan') {
      return [
        { value: 'furniture', label: 'Furniture' },
        { value: 'paintings-visual-arts', label: 'Paintings & Visual Arts' },
        { value: 'weaved-products', label: 'Weaved Products' },
        { value: 'handmade-accessories', label: 'Handmade Accessories' },
        { value: 'sculptures', label: 'Sculptures' }
      ];
    }
    // Default categories for backward compatibility
    return [
      { value: 'breakfast-items', label: 'Breakfast Items' },
      { value: 'beverages', label: 'Beverages' },
      { value: 'desserts', label: 'Desserts' },
      { value: 'snacks', label: 'Snacks' },
      { value: 'meal-sets', label: 'Meal Sets' },
      { value: 'bakery', label: 'Bakery' },
      { value: 'other', label: 'Other' }
    ];
  };

  // Get category label from value
  const getCategoryLabel = (categoryValue) => {
    const categories = getCategories();
    const category = categories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  // API Functions
  const fetchProducts = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      // Fetch all products without filters - let frontend handle filtering
      const response = await fetch(`http://localhost:1337/api/msme/${user._id}/products/owner`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
      } else {
        showError("Failed to fetch products", "Error");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      showError("Failed to fetch products", "Error");
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:1337/api/products', {
        method: 'POST',
        body: productData
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess("Product created successfully!", "Success");
        fetchProducts(); // Refresh the product list
        return true;
      } else {
        showError(data.error || "Failed to create product", "Error");
        return false;
      }
    } catch (error) {
      console.error("Error creating product:", error);
      showError("Failed to create product", "Error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    setLoading(true);
    try {
      console.log('Updating product:', productId);
      console.log('Update data being sent:', {
        productName: productData.get('productName'),
        price: productData.get('price'),
        description: productData.get('description'),
        category: productData.get('category'),
        availability: productData.get('availability'),
        visible: productData.get('visible'),
        variants: productData.get('variants'),
        sizeOptions: productData.get('sizeOptions'),
        hashtags: productData.get('hashtags'),
        existingImages: productData.get('existingImages'),
        picturesCount: productData.getAll('pictures').length
      });
      
      const response = await fetch(`http://localhost:1337/api/products/${productId}`, {
        method: 'PUT',
        body: productData
      });
      
      const data = await response.json();
      console.log('Update response:', data);
      
      if (data.success) {
        showSuccess("Product updated successfully!", "Success");
        fetchProducts(); // Refresh the product list
        return true;
      } else {
        console.error('Update failed:', data.error);
        showError(data.error || "Failed to update product", "Error");
        return false;
      }
    } catch (error) {
      console.error("Error updating product:", error);
      showError("Failed to update product", "Error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const response = await fetch(`http://localhost:1337/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess("Product deleted successfully!", "Success");
        fetchProducts(); // Refresh the product list
        return true;
      } else {
        showError(data.error || "Failed to delete product", "Error");
        return false;
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      showError("Failed to delete product", "Error");
      return false;
    }
  };

  const toggleProductVisibility = async (productId, currentVisibility) => {
    try {
      const response = await fetch(`http://localhost:1337/api/products/${productId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ visible: !currentVisibility })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(data.message, "Success");
        fetchProducts(); // Refresh the product list
        return true;
      } else {
        showError(data.error || "Failed to update product visibility", "Error");
        return false;
      }
    } catch (error) {
      console.error("Error toggling product visibility:", error);
      showError("Failed to update product visibility", "Error");
      return false;
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'available') {
      matchesStatus = product.availability === true;
    } else if (statusFilter === 'unavailable') {
      matchesStatus = product.availability === false;
    } else if (statusFilter === 'visible') {
      matchesStatus = product.visible === true;
    } else if (statusFilter === 'hidden') {
      matchesStatus = product.visible === false;
    }
    // If statusFilter is 'all', matchesStatus stays true
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    // Debug logging (remove this after testing)
    if (statusFilter !== 'all') {
      console.log(`Product: ${product.productName}, Status Filter: ${statusFilter}, Matches: ${matchesStatus}`, {
        availability: product.availability,
        visible: product.visible
      });
    }
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleSidebarToggle = (stateOrIsOpen, isMobile = false) => {
    // Handle both object parameter (from MsmeSidebar) and separate parameters
    if (typeof stateOrIsOpen === 'object') {
      setSidebarState({ 
        isOpen: stateOrIsOpen.isOpen, 
        isMobile: stateOrIsOpen.isMobile 
      });
    } else {
      setSidebarState({ isOpen: stateOrIsOpen, isMobile });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      picture: file
    }));
  };

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && !hashtagList.includes(hashtagInput.trim().toLowerCase())) {
      setHashtagList(prev => [...prev, hashtagInput.trim().toLowerCase()]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tagToRemove) => {
    setHashtagList(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleHashtagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHashtag();
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      price: '',
      description: '',
      availability: true,
      pictures: [],
      hashtags: '',
      category: '',
      artistName: '', // Reset artist name
      variants: [],
      sizeOptions: [],
      selectedVariant: 0
    });
    setHashtagList([]);
    setHashtagInput('');
    setSelectedImages([]);
    setImagePreview([]);
    setExistingImages([]);
    setCurrentVariant({ name: '', price: '' });
    setCurrentSize({ size: '', unit: 'ml', price: '' });
    setShowVariantForm(false);
    setShowSizeForm(false);
    setEditingVariantId(null);
    setEditingVariantData({ name: '', price: '' });
    
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Helper functions for enhanced features
  const handleMultipleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrentImages = existingImages.length + selectedImages.length;
    
    if (files.length + totalCurrentImages > 10) {
      showError('Maximum 10 images allowed per product', 'Too Many Images');
      return;
    }

    const newImages = [...selectedImages, ...files];
    setSelectedImages(newImages);

    // Create preview URLs for new files
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreview(prev => [...prev, ...newPreviews]);

    // Update formData
    setFormData(prev => ({ ...prev, pictures: newImages }));
    
    // Clear validation error for images when user selects files
    if (validationErrors.images) {
      setValidationErrors(prev => ({
        ...prev,
        images: undefined
      }));
    }
  };

  const removeImage = (index) => {
    console.log('Removing image at index:', index);
    console.log('Current existingImages:', existingImages);
    console.log('Current selectedImages:', selectedImages);
    
    // Check if this is an existing image (from server) or a new image (locally selected)
    const totalExistingImages = existingImages.length;
    
    if (index < totalExistingImages) {
      // Removing an existing image - mark it for removal
      const imageToRemove = existingImages[index];
      console.log('Removing existing image:', imageToRemove);
      const newExistingImages = existingImages.filter((_, i) => i !== index);
      setExistingImages(newExistingImages);
      console.log('New existingImages array:', newExistingImages);
    } else {
      // Removing a newly selected image
      const newImageIndex = index - totalExistingImages;
      console.log('Removing newly selected image at index:', newImageIndex);
      const newImages = selectedImages.filter((_, i) => i !== newImageIndex);
      setSelectedImages(newImages);
      
      // Revoke URL to prevent memory leaks for local files
      if (imagePreview[index] && imagePreview[index].startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview[index]);
      }
    }
    
    // Remove from preview array
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImagePreview(newPreviews);
  };

  const addVariant = () => {
    if (!currentVariant.name.trim() || !currentVariant.price.trim()) return;
    
    // Validate that price is a positive number
    const priceValue = parseFloat(currentVariant.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      showError("Variant price must be a positive number greater than 0", "Invalid Price");
      return;
    }
    
    const newVariant = {
      id: Date.now(),
      name: currentVariant.name.trim(),
      price: priceValue,
      imageIndex: selectedImages.length > 0 ? 0 : -1
    };
    
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
    
    setCurrentVariant({ name: '', price: '' });
    setShowVariantForm(false);
  };

  const removeVariant = (variantId) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter(v => v.id !== variantId)
    }));
  };

  const startEditVariant = (variant) => {
    setEditingVariantId(variant.id);
    setEditingVariantData({ name: variant.name, price: variant.price.toString() });
  };

  const cancelEditVariant = () => {
    setEditingVariantId(null);
    setEditingVariantData({ name: '', price: '' });
  };

  const saveEditVariant = () => {
    if (!editingVariantData.name.trim() || !editingVariantData.price.trim()) return;
    
    // Validate that price is a positive number
    const priceValue = parseFloat(editingVariantData.price);
    if (isNaN(priceValue) || priceValue <= 0) {
      showError("Variant price must be a positive number greater than 0", "Invalid Price");
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map(variant => 
        variant.id === editingVariantId 
          ? {
              ...variant,
              name: editingVariantData.name.trim(),
              price: priceValue
            }
          : variant
      )
    }));
    
    setEditingVariantId(null);
    setEditingVariantData({ name: '', price: '' });
  };

  const addSizeOption = () => {
    if (!currentSize.size.trim() || !currentSize.price) return;
    
    const priceValue = parseFloat(currentSize.price);
    if (priceValue <= 0) return;
    
    const newSize = {
      id: Date.now(),
      size: currentSize.size.trim(),
      unit: currentSize.unit,
      price: priceValue
    };
    
    setFormData(prev => ({
      ...prev,
      sizeOptions: [...(prev.sizeOptions || []), newSize]
    }));
    
    setCurrentSize({ size: '', unit: 'ml', price: '' });
    setShowSizeForm(false);
  };

  const removeSizeOption = (sizeId) => {
    setFormData(prev => ({
      ...prev,
      sizeOptions: (prev.sizeOptions || []).filter(s => s.id !== sizeId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?._id) {
      showError("User information not found", "Error");
      return;
    }
    
    // Validate form with enhanced messaging
    // For editing products, consider both existing images and newly selected images
    const totalImages = editingProduct 
      ? [...existingImages, ...selectedImages]
      : selectedImages;
    
    const productData = {
      productName: formData.productName,
      price: formData.price,
      description: formData.description,
      category: formData.category,
      images: totalImages
    };
    
    const validationResult = checkProductCompletion(productData, totalImages);
    setValidationErrors(validationResult.errors);
    
    if (!validationResult.isComplete) {
      const fieldErrors = Object.keys(validationResult.errors).filter(key => key !== 'images');
      const imageErrors = validationResult.errors.images ? 1 : 0;
      
      let errorMessage = "Please complete all required product information to proceed. ";
      
      if (fieldErrors.length > 0) {
        errorMessage += `You have ${fieldErrors.length} product field${fieldErrors.length > 1 ? 's' : ''} that need${fieldErrors.length > 1 ? '' : 's'} attention: `;
        const fieldNames = fieldErrors.map(field => {
          switch(field) {
            case 'productName': return 'Product Name';
            case 'price': return 'Price';
            case 'description': return 'Description';
            case 'category': return 'Category';
            default: return field;
          }
        }).join(', ');
        errorMessage += `${fieldNames}. `;
      }
      
      if (imageErrors) {
        errorMessage += "Additionally, you must upload at least one product image to showcase your product. ";
      }
      
      errorMessage += "All product information and images are required to create a complete and attractive product listing that customers can discover and purchase.";
      
      showError(errorMessage, "Complete Required Information");
      return;
    }
    
    // Clear validation errors if form is valid
    setValidationErrors({});
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('productName', formData.productName);
    submitData.append('price', formData.price);
    submitData.append('description', formData.description);
    submitData.append('availability', formData.availability);
    submitData.append('category', formData.category);
    submitData.append('hashtags', JSON.stringify(hashtagList));
    submitData.append('msmeId', user._id);
    
    // Add artist name if category is paintings & visual arts
    if (formData.category === 'paintings-visual-arts' && formData.artistName) {
      submitData.append('artistName', formData.artistName);
    }
    
    // For updates, preserve visibility status; for new products, set to visible
    if (editingProduct) {
      submitData.append('visible', editingProduct.visible);
      // For updates, send information about existing images to keep
      submitData.append('existingImages', JSON.stringify(existingImages));
      console.log('Existing images being sent to server:', existingImages);
    } else {
      submitData.append('visible', true); // New products are visible by default
    }
    
    // Handle multiple images
    selectedImages.forEach((image, index) => {
      submitData.append('pictures', image);
    });
    
    // Add variants and size options as JSON
    submitData.append('variants', JSON.stringify(formData.variants || []));
    submitData.append('sizeOptions', JSON.stringify(formData.sizeOptions || []));

    let success = false;
    if (editingProduct) {
      // Update existing product
      success = await updateProduct(editingProduct._id, submitData);
      if (success) {
        setShowEditModal(false);
        setEditingProduct(null);
      }
    } else {
      // Create new product
      success = await createProduct(submitData);
      if (success) {
        setShowAddModal(false);
      }
    }

    if (success) {
      resetForm();
    }
  };

  const handleEdit = (product) => {
    console.log('Edit button clicked for product:', product);
    console.log('Current showEditModal state:', showEditModal);
    console.log('Current editingProduct state:', editingProduct);
    
    // Set the editing product first
    setEditingProduct(product);
    console.log('Setting editingProduct to:', product);
    
    // Populate form data with product details
    const newFormData = {
      productName: product.productName || '',
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      availability: product.availability !== undefined ? product.availability : true,
      pictures: [], // Will be handled separately for existing images
      hashtags: '',
      category: product.category || '',
      artistName: product.artistName || '', // Set artist name if exists
      variants: Array.isArray(product.variants) ? product.variants : [], 
      sizeOptions: Array.isArray(product.sizeOptions) ? product.sizeOptions : [], 
      selectedVariant: 0
    };
    
    console.log('Setting form data to:', newFormData);
    setFormData(newFormData);
    
    // Set hashtags
    const hashtagsToSet = Array.isArray(product.hashtags) ? product.hashtags : [];
    console.log('Setting hashtags to:', hashtagsToSet);
    setHashtagList(hashtagsToSet);
    setHashtagInput('');
    
    // Handle existing images
    if (product.pictures && Array.isArray(product.pictures) && product.pictures.length > 0) {
      // Store existing images for tracking removal
      setExistingImages([...product.pictures]);
      
      // Set image previews for existing images
      const existingPreviews = product.pictures.map(pic => getImageUrl(pic));
      setImagePreview(existingPreviews);
      setSelectedImages([]); // No new images selected yet
    } else if (product.picture) {
      // Fallback to single picture
      setExistingImages([product.picture]);
      const preview = getImageUrl(product.picture);
      setImagePreview([preview]);
      setSelectedImages([]);
    } else {
      // No existing images
      setExistingImages([]);
      setImagePreview([]);
      setSelectedImages([]);
    }
    
    // Clear any form-related states
    setCurrentVariant({ name: '', price: '' });
    setCurrentSize({ size: '', unit: 'ml', price: '' });
    setShowVariantForm(false);
    setShowSizeForm(false);
    setEditingVariantId(null);
    setEditingVariantData({ name: '', price: '' });
    
    // Show the edit modal
    console.log('Setting showEditModal to true');
    setShowEditModal(true);
  };

// Delete product handler with notification confirmation
  const handleDelete = async (product) => {
    console.log('handleDelete called, showConfirm available:', typeof showConfirm);
    console.log('All notification functions:', { showSuccess, showError, showConfirm });
    
    // Fallback to window.confirm if showConfirm is not available
    let confirmed = false;
    
    if (typeof showConfirm === 'function') {
      try {
        confirmed = await showConfirm(
          `Are you sure you want to delete "${product.productName}"?`,
          "Confirm Delete"
        );
      } catch (error) {
        console.error('Error with showConfirm:', error);
        confirmed = window.confirm(`Are you sure you want to delete "${product.productName}"?`);
      }
    } else {
      console.warn('showConfirm not available, using window.confirm');
      confirmed = window.confirm(`Are you sure you want to delete "${product.productName}"?`);
    }
    
    if (confirmed) {
      await deleteProduct(product._id);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const toggleDropdown = (productId) => {
    setOpenDropdown(openDropdown === productId ? null : productId);
  };

  const handleFilterChange = () => {
    fetchProducts();
  };

  // Update filters and refetch when they change
  useEffect(() => {
    if (user?._id) {
      fetchProducts();
    }
  }, [user]); // Only refetch when user changes, not when filters change

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

  const getProductImageUrl = (product) => {
    if (product.pictures && product.pictures.length > 0) {
      return getImageUrl(product.pictures[0]);
    } else if (product.picture) {
      return getImageUrl(product.picture);
    }
    return shakshoukaImg; // Default image
  };

  const getContentClass = () => {
    if (sidebarState.isMobile) {
      return 'msme-manage-product-content msme-manage-product-content--mobile';
    }
    return sidebarState.isOpen 
      ? 'msme-manage-product-content sidebar-open' 
      : 'msme-manage-product-content sidebar-closed';
  };

  return (
    <div className="msme-manage-product-container">
      <MsmeSidebar onSidebarToggle={handleSidebarToggle} />
      <div className={getContentClass()}>
        <div className="msme-manage-product-header">
          <div className="msme-manage-product-header-content">
            <div className="msme-manage-product-header-text">
              <h1>Product Management</h1>
              <p>Manage your products and inventory on the platform.</p>
            </div>
            <div className="msme-manage-product-actions">
              <button 
                className="msme-manage-product-add-button"
                onClick={() => setShowAddModal(true)}
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>
        <div className="msme-manage-product-filters">
          <div className="msme-manage-product-filters-row">
            <input 
              type="text" 
              placeholder="Search products..." 
              className="msme-manage-product-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
              className="msme-manage-product-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="visible">Visible Products</option>
              <option value="hidden">Hidden Products</option>
            </select>
            <select 
              className="msme-manage-product-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {getCategories().map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="msme-manage-product-grid">
          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '200px',
              fontSize: '18px',
              color: '#666'
            }}>
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '200px',
              fontSize: '18px',
              color: '#666'
            }}>
              {products.length === 0 ? 'No products found. Add your first product!' : 'No products match your search criteria.'}
            </div>
          ) : (
            filteredProducts.map((product) => {

              return (
                <div key={product._id} className={`msme-manage-product-card ${!product.visible ? 'hidden-product' : ''}`}>
                  <div className="msme-manage-product-visibility-indicator">
                    <span className={`visibility-status ${product.visible ? 'visible' : 'hidden'}`}>
                      {product.visible ? ' Visible' : ' Hidden'}
                    </span>
                    
                    {/* 3-dot menu moved to top right corner */}
                    <div className="dropdown-container">
                      <button 
                        className="three-dot-menu"
                        onClick={() => toggleDropdown(product._id)}
                      >
                        ⋮
                      </button>
                      {openDropdown === product._id && (
                        <div className="dropdown-menu">
                          <button 
                            className="dropdown-item"
                            onClick={() => {
                              handleEdit(product);
                              setOpenDropdown(null);
                            }}
                          >
                            Edit Product
                          </button>
                          <button 
                            className="dropdown-item delete"
                            onClick={() => {
                              handleDelete(product);
                              setOpenDropdown(null);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <img 
                    src={getProductImageUrl(product)} 
                    alt={product.productName} 
                    className="msme-manage-product-image" 
                  />
                  <div className="msme-manage-product-info">
                    <div className="msme-manage-product-top-content">
                      <h3>{product.productName}</h3>
                      {/* Artist Name - Only show for artworks */}
                      {product.artistName && (
                        <p className="msme-manage-product-artist">
                          <span className="artist-label">Artist: </span>
                          <span className="artist-name">{product.artistName}</span>
                        </p>
                      )}
                      <p className="msme-manage-product-description">{product.description}</p>
                      <div className="msme-manage-product-price-and-availability">
                        <p className="msme-manage-product-price">₱{product.price}</p>
                        <div className="msme-manage-product-availability-container">
                          <div className="msme-manage-product-availability-info">
                            <span className={`msme-manage-product-availability ${product.availability ? 'available' : 'unavailable'}`}>
                              {product.availability ? 'Available' : 'Unavailable'}
                            </span>
                            {/* Visibility Toggle moved here */}
                            <div className="msme-manage-product-visibility-control-inline">
                              <span className="visibility-label-small">Visible to customers:</span>
                              <div className="toggle-switch">
                                <input 
                                  type="checkbox" 
                                  id={`visibility-${product._id}`}
                                  checked={product.visible}
                                  onChange={() => toggleProductVisibility(product._id, product.visible)}
                                  className="toggle-checkbox"
                                />
                                <label htmlFor={`visibility-${product._id}`} className="toggle-label">
                                  <span className="toggle-inner"></span>
                                  <span className="toggle-switch-handle"></span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {product.hashtags && product.hashtags.length > 0 && (
                        <div className="msme-manage-product-hashtags">
                          {product.hashtags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="msme-manage-product-hashtag">
                              #{tag}
                            </span>
                          ))}
                          {product.hashtags.length > 3 && (
                            <span className="msme-manage-product-hashtag-more">
                              +{product.hashtags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="msme-manage-product-bottom-content">
                      {/* Actions now handled by 3-dot menu */}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Add/Edit Product Modal */}
        {(showAddModal || showEditModal) && (
          <div className="modal-overlay">
            <div className="add-product-modal">
              <div className="modal-header">
                <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                <button 
                  className="modal-close-btn"
                  onClick={handleModalClose}
                >
                  ×
                </button>
              </div>
              
              {/* Progress Bar at Top */}
              {loading && (
                <div className="modal-progress-container top-progress">
                  <div className="modal-progress-bar">
                    <div className="modal-progress-fill"></div>
                  </div>
                  <p className="modal-progress-text">
                    {editingProduct ? 'Updating your product...' : 'Adding your product...'}
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="add-product-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="productName">Product Name *</label>
                    <input
                      type="text"
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      maxLength="100"
                      placeholder="Enter product name"
                      className={validationErrors.productName ? 'error' : ''}
                    />
                    <ValidationMessage error={validationErrors.productName} />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="price">Price (₱) *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={validationErrors.price ? 'error' : ''}
                    />
                    <ValidationMessage error={validationErrors.price} />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    maxLength="1000"
                    rows="4"
                    placeholder="Describe your product..."
                    className={validationErrors.description ? 'error' : ''}
                  />
                  <ValidationMessage error={validationErrors.description} />
                  <small className="char-counter">
                    {formData.description.length}/1000 characters
                  </small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={validationErrors.category ? 'error' : ''}
                    >
                      <option value="">Select category</option>
                      {getCategories().map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <ValidationMessage error={validationErrors.category} />
                  </div>
                  
                  {/* Artist Name Field - Only show for Paintings & Visual Arts category */}
                  {formData.category === 'paintings-visual-arts' && (
                    <div className="form-group">
                      <label htmlFor="artistName">Artist Name</label>
                      <input
                        type="text"
                        id="artistName"
                        name="artistName"
                        value={formData.artistName}
                        onChange={handleInputChange}
                        maxLength="100"
                        placeholder="Enter artist name"
                      />
                      <small>Name of the artist who created this artwork</small>
                    </div>
                  )}
                </div>

                {/* Multiple Images Upload */}
                <div className="form-group">
                  <label htmlFor="pictures">Product Images (1-10 images) *</label>
                  <input
                    type="file"
                    id="pictures"
                    name="pictures"
                    onChange={handleMultipleImageSelect}
                    accept="image/*"
                    multiple
                    className={`file-input ${validationErrors.images ? 'error' : ''}`}
                  />
                  <ValidationMessage error={validationErrors.images} />
                  <small>Recommended: JPG, PNG, max 5MB each. Upload 1-10 images.</small>
                  
                  {/* Image Preview */}
                  {imagePreview.length > 0 && (
                    <div className="image-preview-container">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="image-preview-item">
                          <img src={preview} alt={`Preview ${index + 1}`} className="image-preview" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="remove-image-btn"
                          >
                            ×
                          </button>
                          <span className="image-number">{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Size Options for Beverages - Disabled, using variants instead */}
                {false && formData.category === 'beverages' && (
                  <div className="form-group">
                    <label>Size Options</label>
                    <div className="size-options-container">
                      {(formData.sizeOptions || []).map((size) => (
                        <div key={size.id} className="size-option-item">
                          <div className="size-info">
                            <span className="size-name">{size.size} {size.unit}</span>
                            <span className="size-price">₱{size.price}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSizeOption(size.id)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      
                      {showSizeForm ? (
                        <div className="add-size-form">
                          <input
                            type="text"
                            value={currentSize.size}
                            onChange={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setCurrentSize(prev => ({ ...prev, size: e.target.value }));
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                // Move to price field or add if price is filled
                                if (currentSize.price) {
                                  addSizeOption();
                                }
                              }
                            }}
                            placeholder="Size (e.g., 250, 500)"
                            className="size-input"
                            autoFocus
                          />
                          <select
                            value={currentSize.unit}
                            onChange={(e) => setCurrentSize(prev => ({ ...prev, unit: e.target.value }))}
                            className="unit-select"
                          >
                            <option value="ml">ml</option>
                            <option value="L">L</option>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="oz">oz</option>
                            <option value="lb">lb</option>
                          </select>
                          <input
                            type="number"
                            value={currentSize.price}
                            onChange={(e) => setCurrentSize(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="Price (₱)"
                            min="0.01"
                            step="0.01"
                            className="size-price-input"
                          />
                          <button type="button" onClick={addSizeOption} className="add-btn">Add</button>
                          <button type="button" onClick={() => setShowSizeForm(false)} className="cancel-btn">Cancel</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowSizeForm(true)}
                          className="add-size-btn"
                        >
                          + Add Size Option
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Variants/Flavors for Food and Beverages */}
                {(formData.category === 'processed-foods' || formData.category === 'baked-goods' || formData.category === 'confectionery' || formData.category === 'beverages') && (
                  <div className="form-group">
                    <label>Product Variants/Flavors</label>
                    <div className="variants-container">
                      {(formData.variants || []).map((variant) => (
                        <div key={variant.id} className="variant-item">
                          {editingVariantId === variant.id ? (
                            <div className="edit-variant-form">
                              <input
                                type="text"
                                value={editingVariantData.name}
                                onChange={(e) => setEditingVariantData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Variant name"
                                className="variant-input variant-name-input"
                              />
                              <input
                                type="number"
                                value={editingVariantData.price}
                                onChange={(e) => setEditingVariantData(prev => ({ ...prev, price: e.target.value }))}
                                placeholder="Price (₱)"
                                min="0.01"
                                step="0.01"
                                className="variant-input variant-price-input"
                              />
                              <button type="button" onClick={saveEditVariant} className="save-btn">Save</button>
                              <button type="button" onClick={cancelEditVariant} className="cancel-btn">Cancel</button>
                            </div>
                          ) : (
                            <>
                              <div className="variant-info">
                                <span className="variant-name">{variant.name}</span>
                                <span className="variant-price">₱{variant.price}</span>
                              </div>
                              <div className="variant-actions">
                                <button
                                  type="button"
                                  onClick={() => startEditVariant(variant)}
                                  className="edit-btn"
                                  title="Edit variant"
                                >
                                  ✎
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(variant.id)}
                                  className="remove-btn"
                                  title="Remove variant"
                                >
                                  ×
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      
                      {showVariantForm ? (
                        <div className="add-variant-form">
                          <input
                            type="text"
                            value={currentVariant.name}
                            onChange={(e) => setCurrentVariant(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Spicy, Cheese, Ube, Pastillas"
                            className="variant-input variant-name-input"
                          />
                          <input
                            type="number"
                            value={currentVariant.price}
                            onChange={(e) => setCurrentVariant(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="Price (₱)"
                            min="0.01"
                            step="0.01"
                            className="variant-input variant-price-input"
                          />
                          <button type="button" onClick={addVariant} className="add-btn">Add</button>
                          <button type="button" onClick={() => setShowVariantForm(false)} className="cancel-btn">Cancel</button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowVariantForm(true)}
                          className="add-variant-btn"
                        >
                          + Add Variant/Flavor
                        </button>
                      )}
                    </div>
                    <small>Add different flavors or variants of your product (e.g., Spicy, Cheese, Different flavors)</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Hashtags for Filtering</label>
                  <div className="hashtag-input-container">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyPress={handleHashtagKeyPress}
                      placeholder="Add hashtag and press Enter"
                      className="hashtag-input"
                    />
                    <button
                      type="button"
                      onClick={handleAddHashtag}
                      className="add-hashtag-btn"
                    >
                      Add
                    </button>
                  </div>
                  
                  {hashtagList.length > 0 && (
                    <div className="hashtag-list">
                      {hashtagList.map((tag, index) => (
                        <span key={index} className="hashtag-item">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveHashtag(tag)}
                            className="remove-hashtag-btn"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="availability"
                      checked={formData.availability}
                      onChange={handleInputChange}
                    />
                    <span className="checkbox-text">Product is available for sale</span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MsmeManageProduct;