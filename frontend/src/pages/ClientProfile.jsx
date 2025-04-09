import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Grid,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Container,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  AlertTitle
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { DataGrid, frFR, GridActionsCellItem } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, parse } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { useParams, useNavigate } from 'react-router-dom';
import VersementForfaitDialog from '../components/VersementForfaitDialog';
import { API_URL } from '../App';

/**
 * ClientProfile component displays a full page with client details, editable fields,
 * and tabs for related information
 */
const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [client, setClient] = useState(null);
  const [agents, setAgents] = useState([]);
  const [editableFields, setEditableFields] = useState({
    nom: false,
    specialite: false,
    tel: false,
    mode: false,
    agent: false,
    etat_contrat: false,
    debut_contrat: false,
    fin_contrat: false
  });
  const [formData, setFormData] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // New states for the Bon de passage dialog
  const [openBonPassageDialog, setOpenBonPassageDialog] = useState(false);
  const [openViewBonPassageDialog, setOpenViewBonPassageDialog] = useState(false);
  const [selectedBonPassage, setSelectedBonPassage] = useState(null);
  const [bonPassageData, setBonPassageData] = useState({
    date: new Date(),
    client_id: null,
    consommables: [],
    services: [],
    exces_poids: 0,
    poids_collecte: 0,
    montant: 0
  });
  const [produits, setProduits] = useState([]);
  const [servicesData, setServicesData] = useState([]);
  const [bonsPassage, setBonsPassage] = useState([]);
  
  // New states for the Contract dialog
  const [openContractDialog, setOpenContractDialog] = useState(false);
  const [contractData, setContractData] = useState({
    date_debut: new Date(),
    date_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    montant: 0,
    prix_exces_poids: 0,
    poids_forfait: 0,
    client_id: null,
    etat: 'Actif'
  });
  const [contracts, setContracts] = useState([]);
  // Prix excès poids from active contract
  const [prix_exces_poids, setPrixExcesPoids] = useState(0);

  // New state to track if we're editing a contract
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Add new state for warning dialog
  const [openWarningDialog, setOpenWarningDialog] = useState(false);
  const [existingActiveContract, setExistingActiveContract] = useState(null);
  const [attemptedAction, setAttemptedAction] = useState(null); // 'create' or 'edit'

  // Add new state for bon passage warning dialog
  const [openBonPassageWarningDialog, setOpenBonPassageWarningDialog] = useState(false);

  // Add new states for versements
  const [versements, setVersements] = useState([]);
  const [openVersementDialog, setOpenVersementDialog] = useState(false);
  const [selectedVersement, setSelectedVersement] = useState(null);

  // Fetch client data
  useEffect(() => {
    const fetchClientData = async () => {
      setLoading(true);
      try {
        // Fetch client
        const clientResponse = await fetch(`${API_URL}/clients/${id}`);
        if (!clientResponse.ok) {
          throw new Error(`Erreur HTTP: ${clientResponse.status}`);
        }
        const clientData = await clientResponse.json();
        setClient(clientData);
        
        // Initialize form data with client data
        setFormData({
          ...clientData,
          debut_contrat: clientData.debut_contrat ? (() => {
            try {
              return parse(clientData.debut_contrat, 'dd/MM/yyyy', new Date());
            } catch (error) {
              console.error(`Error parsing debut_contrat date "${clientData.debut_contrat}":`, error);
              return null;
            }
          })() : null,
          fin_contrat: clientData.fin_contrat ? (() => {
            try {
              return parse(clientData.fin_contrat, 'dd/MM/yyyy', new Date());
            } catch (error) {
              console.error(`Error parsing fin_contrat date "${clientData.fin_contrat}":`, error);
              return null;
            }
          })() : null
        });

        // Initialize bon de passage data with client ID
        setBonPassageData({
          date: new Date(),
          client_id: clientData.id,
          consommables: [],
          services: [],
          exces_poids: 0,
          poids_collecte: 0,
          montant: 0
        });
        
        // Initialize contract data with client ID
        setContractData(prev => ({
          ...prev,
          client_id: clientData.id
        }));

        // Fetch agents for dropdown
        const agentsResponse = await fetch(`${API_URL}/agents`);
        if (!agentsResponse.ok) {
          throw new Error(`Erreur HTTP: ${agentsResponse.status}`);
        }
        const agentsData = await agentsResponse.json();
        setAgents(agentsData);

        // Fetch produits for consumables dropdown
        const produitsResponse = await fetch(`${API_URL}/produits`);
        if (!produitsResponse.ok) {
          throw new Error(`Erreur HTTP: ${produitsResponse.status}`);
        }
        const produitsData = await produitsResponse.json();
        setProduits(produitsData);

        // Fetch services for services dropdown
        const servicesResponse = await fetch(`${API_URL}/services`);
        if (!servicesResponse.ok) {
          throw new Error(`Erreur HTTP: ${servicesResponse.status}`);
        }
        const servicesData = await servicesResponse.json();
        setServicesData(servicesData);

        // Fetch bons de passage for this client
        await fetchBonsPassage(clientData.id);
        
        // Fetch contracts for this client
        await fetchContracts(clientData.id);
        
        // Fetch versements for this client
        await fetchVersements(clientData.id);

        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(`Erreur lors du chargement des données: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClientData();
    }
  }, [id]);

  // Fetch bons de passage for the client
  const fetchBonsPassage = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/bon-passage-forfait`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setBonsPassage(data);
      return data;
    } catch (error) {
      console.error('Error fetching bons de passage:', error);
      showSnackbar('Erreur lors du chargement des bons de passage', 'error');
      return [];
    }
  };

  // Fetch contracts for the client
  const fetchContracts = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/contrats-forfait`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setContracts(data);
      
      // Set prix_exces_poids from the active contract if it exists
      const activeContract = data.find(contract => contract.etat === 'Actif');
      if (activeContract) {
        setPrixExcesPoids(activeContract.prix_exces_poids || 0);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showSnackbar('Erreur lors du chargement des contrats', 'error');
      return [];
    }
  };

  // Fetch versements for the client
  const fetchVersements = async (clientId) => {
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}/versements-forfait`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setVersements(data);
      return data;
    } catch (error) {
      console.error('Error fetching versements:', error);
      showSnackbar('Erreur lors du chargement des versements', 'error');
      return [];
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  const toggleFieldEdit = (field) => {
    // If we're toggling from edit mode to view mode, save the changes
    if (editableFields[field]) {
      // Here we save the individual field
      saveClientData(field);
    }
    
    setEditableFields({
      ...editableFields,
      [field]: !editableFields[field]
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const saveClientData = async (field = null) => {
    try {
      // Clone the form data to avoid modifying the original state
      const dataToSave = { ...formData };
      
      // Debug log
      console.log('Original form data:', dataToSave);
      
      // Format dates only if they are valid Date objects
      if (dataToSave.debut_contrat instanceof Date && !isNaN(dataToSave.debut_contrat)) {
        dataToSave.debut_contrat = format(dataToSave.debut_contrat, 'dd/MM/yyyy');
      } else if (dataToSave.debut_contrat === null || dataToSave.debut_contrat === undefined) {
        dataToSave.debut_contrat = null;
      }
      
      if (dataToSave.fin_contrat instanceof Date && !isNaN(dataToSave.fin_contrat)) {
        dataToSave.fin_contrat = format(dataToSave.fin_contrat, 'dd/MM/yyyy');
      } else if (dataToSave.fin_contrat === null || dataToSave.fin_contrat === undefined) {
        dataToSave.fin_contrat = null;
      }
      
      // Debug log
      console.log('Data being sent to server:', dataToSave);
      
      // Send the updated data to the server
      const response = await fetch(`${API_URL}/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorData.detail || response.statusText}`);
      }
      
      const updatedClient = await response.json();
      
      // Update the form data with the response
      setFormData({
        ...updatedClient,
        debut_contrat: updatedClient.debut_contrat ? parse(updatedClient.debut_contrat, 'dd/MM/yyyy', new Date()) : null,
        fin_contrat: updatedClient.fin_contrat ? parse(updatedClient.fin_contrat, 'dd/MM/yyyy', new Date()) : null
      });
      
      // If a specific field was modified, disable its edit mode
      if (field) {
        setEditableFields({ ...editableFields, [field]: false });
      }
      
      showSnackbar('Client mis à jour avec succès', 'success');
    } catch (error) {
      console.error('Error updating client:', error);
      showSnackbar(`Erreur lors de la mise à jour du client: ${error.message}`, 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleBackToClients = () => {
    navigate('/clients');
  };

  // Handling functions for Bon de passage dialog
  const handleOpenBonPassageDialog = () => {
    // Check if client has an active contract
    if (!formData.etat_contrat) {
      setOpenBonPassageWarningDialog(true);
      return;
    }
    
    // Check if the contract is paused
    if (formData.etat_contrat === 'Pause') {
      // Use the same warning dialog but with a different message
      setAttemptedAction('bonPassagePause');
      setOpenWarningDialog(true);
      return;
    }

    setBonPassageData({
      date: new Date(),
      client_id: client.id,
      consommables: [],
      services: [],
      exces_poids: 0,
      poids_collecte: 0,
      montant: 0
    });
    setOpenBonPassageDialog(true);
  };

  const handleCloseBonPassageDialog = () => {
    setOpenBonPassageDialog(false);
  };

  const handleCloseBonPassageWarningDialog = () => {
    setOpenBonPassageWarningDialog(false);
  };

  const handleAddConsommable = () => {
    setBonPassageData({
      ...bonPassageData,
      consommables: [...bonPassageData.consommables, { produit: '', qte: '', prix: '', isEditing: true }]
    });
  };

  const handleConsommableChange = (index, field, value) => {
    const newConsommables = [...bonPassageData.consommables];
    newConsommables[index][field] = value;
    
    // Calculate the total whenever consommables change
    const newTotal = newConsommables.reduce((sum, item) => {
      const quantity = parseFloat(item.qte) || 0;
      const price = parseFloat(item.prix) || 0;
      return sum + (quantity * price);
    }, 0);
    
    setBonPassageData({ 
      ...bonPassageData, 
      consommables: newConsommables,
      montant: newTotal 
    });
  };

  const handleDeleteConsommable = (index) => {
    const newConsommables = bonPassageData.consommables.filter((_, i) => i !== index);
    setBonPassageData({ ...bonPassageData, consommables: newConsommables });
  };

  const handleAddService = () => {
    setBonPassageData({
      ...bonPassageData,
      services: [...bonPassageData.services, { service: '', qte: '', isEditing: true }]
    });
  };

  const handleServiceChange = (index, field, value) => {
    const newServices = [...bonPassageData.services];
    newServices[index][field] = value;
    setBonPassageData({ ...bonPassageData, services: newServices });
  };

  const handleDeleteService = (index) => {
    const newServices = bonPassageData.services.filter((_, i) => i !== index);
    setBonPassageData({ ...bonPassageData, services: newServices });
  };

  const handleSubmitBonPassage = async () => {
    try {
      if (!bonPassageData.client_id) {
        showSnackbar('ID client manquant', 'error');
        return;
      }

      if (bonPassageData.consommables.length === 0 && bonPassageData.services.length === 0) {
        showSnackbar('Veuillez ajouter au moins un consommable ou un service', 'error');
        return;
      }
      
      if (!bonPassageData.poids_collecte || parseInt(bonPassageData.poids_collecte) <= 0) {
        showSnackbar('Le poids collecté doit être supérieur à 0', 'error');
        return;
      }

      // Validate consommables
      const invalidConsommables = bonPassageData.consommables.filter(c => !c.produit || !c.qte || !c.prix);
      if (invalidConsommables.length > 0) {
        showSnackbar('Tous les consommables doivent avoir un nom, une quantité et un prix', 'error');
        return;
      }

      // Validate services (require name, quantity is optional)
      const invalidServices = bonPassageData.services.filter(s => !s.service);
      if (invalidServices.length > 0) {
        showSnackbar('Tous les services doivent avoir un nom', 'error');
        return;
      }

      const formattedDate = format(bonPassageData.date, 'dd/MM/yyyy');
      
      // Calculate total using our helper function
      const totalMontant = calculateTotal();
      
      // Ensure exces_poids is never null
      const excesPoids = parseInt(bonPassageData.exces_poids) || 0;
      const poidsCollecte = parseInt(bonPassageData.poids_collecte) || 0;
      
      console.log(`Total montant: ${totalMontant} (includes excess weight cost)`);
      
      // Create bon passage with explicit non-null values
      const bonPassageResponse = await fetch(`${API_URL}/bon-passage-forfait`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: bonPassageData.client_id,
          date: format(bonPassageData.date, 'yyyy-MM-dd'),
          poids_collecte: poidsCollecte,
          exces_poids: excesPoids,
          montant: totalMontant
        }),
      });

      if (!bonPassageResponse.ok) {
        const errorText = await bonPassageResponse.text();
        console.error('Error response from server:', errorText);
        throw new Error(`Erreur lors de la création du bon de passage: ${errorText}`);
      }

      const savedBonPassage = await bonPassageResponse.json();
      const bonPassageId = savedBonPassage.id;

      console.log('Created bon passage with ID:', bonPassageId);

      // Add consommables
      for (const consommable of bonPassageData.consommables) {
        const produitData = {
          produit: consommable.produit,
          qte: parseFloat(consommable.qte),
          prix: parseInt(consommable.prix),
          bon_passage_id: bonPassageId
        };
        
        console.log('Sending produit data:', produitData);
        
        const produitResponse = await fetch(`${API_URL}/bon-passage-forfait/${bonPassageId}/produits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(produitData),
        });
        
        if (!produitResponse.ok) {
          const errorText = await produitResponse.text();
          console.error('Error adding produit:', errorText);
          throw new Error(`Erreur lors de l'ajout du produit: ${errorText}`);
        }
      }

      // Add services
      for (const service of bonPassageData.services) {
        const serviceData = {
          service: service.service,
          qte: service.qte ? parseFloat(service.qte) : null,
          bon_passage_id: bonPassageId
        };
        
        console.log('Sending service data:', serviceData);
        
        const serviceResponse = await fetch(`${API_URL}/bon-passage-forfait/${bonPassageId}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData),
        });
        
        if (!serviceResponse.ok) {
          const errorText = await serviceResponse.text();
          console.error('Error adding service:', errorText);
          throw new Error(`Erreur lors de l'ajout du service: ${errorText}`);
        }
      }

      showSnackbar('Bon de passage créé avec succès', 'success');
      handleCloseBonPassageDialog();
      fetchBonsPassage(client.id);
    } catch (error) {
      console.error('Error creating bon de passage:', error);
      showSnackbar(error.message || 'Erreur lors de la création du bon de passage', 'error');
    }
  };

  // Handle viewing/editing a bon de passage
  const handleViewBonPassage = (bon) => {
    setSelectedBonPassage(bon);
    setBonPassageData({
      id: bon.id,
      date: parse(bon.date, 'dd/MM/yyyy', new Date()),
      client_id: bon.client_id,
      exces_poids: bon.exces_poids || 0,
      montant: bon.montant || 0,
      poids_collecte: bon.poids_collecte || 0,
      consommables: [],
      services: []
    });
    
    // Fetch products and services for this bon
    fetchBonPassageProducts(bon.id);
    fetchBonPassageServices(bon.id);
    
    setOpenViewBonPassageDialog(true);
  };

  // Fetch products for a specific bon de passage
  const fetchBonPassageProducts = async (bonId) => {
    try {
      const response = await fetch(`${API_URL}/bon-passage-forfait/${bonId}/produits`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setBonPassageData(prev => ({
        ...prev,
        consommables: data.map(p => ({ 
          produit: p.produit, 
          qte: p.qte, 
          prix: p.prix
        }))
      }));
    } catch (error) {
      console.error('Error fetching bon passage products:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };

  // Fetch services for a specific bon de passage
  const fetchBonPassageServices = async (bonId) => {
    try {
      const response = await fetch(`${API_URL}/bon-passage-forfait/${bonId}/services`);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      const data = await response.json();
      setBonPassageData(prev => ({
        ...prev,
        services: data.map(s => ({ 
          service: s.service, 
          qte: s.qte
        }))
      }));
    } catch (error) {
      console.error('Error fetching bon passage services:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };

  // Handle deleting a bon de passage
  const handleDeleteBonPassage = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bon de passage ?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/bon-passage-forfait/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      showSnackbar('Bon de passage supprimé avec succès', 'success');
      fetchBonsPassage(client.id); // Refresh the list
    } catch (error) {
      console.error('Error deleting bon de passage:', error);
      showSnackbar(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
  };

  // Handle closing view/edit dialog
  const handleCloseViewBonPassageDialog = () => {
    setOpenViewBonPassageDialog(false);
    setSelectedBonPassage(null);
  };

  // Handle modifying a bon de passage (delete old one & create new one)
  const handleModifyBonPassage = async () => {
    try {
      if (!selectedBonPassage) {
        showSnackbar('Aucun bon de passage sélectionné', 'error');
        return;
      }

      // Validate consommables
      const invalidConsommables = bonPassageData.consommables.filter(c => !c.produit || !c.qte || !c.prix);
      if (invalidConsommables.length > 0) {
        showSnackbar('Tous les consommables doivent avoir un nom, une quantité et un prix', 'error');
        return;
      }

      // Validate services
      const invalidServices = bonPassageData.services.filter(s => !s.service);
      if (invalidServices.length > 0) {
        showSnackbar('Tous les services doivent avoir un nom', 'error');
        return;
      }

      const formattedDate = format(bonPassageData.date, 'dd/MM/yyyy');
      
      // Calculate total from consommables
      let totalMontant = bonPassageData.consommables.reduce((sum, item) => {
        const quantity = parseFloat(item.qte) || 0;
        const price = parseFloat(item.prix) || 0;
        return sum + (quantity * price);
      }, 0);
      
      // Ensure poids_collecte is not null
      const poidsCollecte = parseInt(bonPassageData.poids_collecte) || 0;
      
      // Add cost of excess weight to total
      const coutExcesPoids = parseInt(bonPassageData.exces_poids) * prix_exces_poids;
      totalMontant += coutExcesPoids;
      
      console.log(`Excess weight: ${bonPassageData.exces_poids}kg at ${prix_exces_poids}/kg = ${coutExcesPoids}`);
      console.log(`Total montant: ${totalMontant} (includes excess weight cost)`);
      
      // Delete old bon passage
      const deleteResponse = await fetch(`${API_URL}/bon-passage-forfait/${selectedBonPassage.id}`, {
        method: 'DELETE'
      });
      
      if (!deleteResponse.ok) {
        throw new Error(`Erreur lors de la suppression: ${deleteResponse.status}`);
      }

      // Create new bon passage with modified data
      const createResponse = await fetch(`${API_URL}/bon-passage-forfait`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formattedDate,
          client_id: client.id,
          montant: totalMontant,
          exces_poids: bonPassageData.exces_poids,
          poids_collecte: poidsCollecte
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Erreur lors de la création: ${createResponse.status}`);
      }

      const newBonPassage = await createResponse.json();
      const bonPassageId = newBonPassage.id;

      // Add consommables
      for (const consommable of bonPassageData.consommables) {
        const produitData = {
          produit: consommable.produit,
          qte: parseFloat(consommable.qte),
          prix: parseInt(consommable.prix),
          bon_passage_id: bonPassageId
        };
        
        const produitResponse = await fetch(`${API_URL}/bon-passage-forfait/${bonPassageId}/produits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(produitData),
        });
        
        if (!produitResponse.ok) {
          throw new Error(`Erreur lors de l'ajout du produit: ${produitResponse.status}`);
        }
      }

      // Add services
      for (const service of bonPassageData.services) {
        const serviceData = {
          service: service.service,
          qte: service.qte ? parseFloat(service.qte) : null,
          bon_passage_id: bonPassageId
        };
        
        const serviceResponse = await fetch(`${API_URL}/bon-passage-forfait/${bonPassageId}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serviceData),
        });
        
        if (!serviceResponse.ok) {
          throw new Error(`Erreur lors de l'ajout du service: ${serviceResponse.status}`);
        }
      }

      showSnackbar('Bon de passage modifié avec succès', 'success');
      handleCloseViewBonPassageDialog();
      fetchBonsPassage(client.id);
    } catch (error) {
      console.error('Error modifying bon de passage:', error);
      showSnackbar(error.message || 'Erreur lors de la modification du bon de passage', 'error');
    }
  };

  // Handle opening the contract dialog
  const handleOpenContractDialog = () => {
    // Check if there is already an active or paused contract
    const activeOrPausedContract = contracts.find(c => c.etat === 'Actif' || c.etat === 'Pause');
    
    if (activeOrPausedContract) {
      setExistingActiveContract(activeOrPausedContract);
      setAttemptedAction('create');
      setOpenWarningDialog(true);
    } else {
      setIsEditingContract(false);
      setSelectedContract(null);
      setContractData({
        date_debut: new Date(),
        date_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        montant: 0,
        prix_exces_poids: 0,
        poids_forfait: 0,
        client_id: client.id,
        etat: 'Actif'
      });
      setOpenContractDialog(true);
    }
  };
  
  // Handle closing the warning dialog
  const handleCloseWarningDialog = () => {
    setOpenWarningDialog(false);
    setExistingActiveContract(null);
    setAttemptedAction(null);
  };
  
  // Handle closing the contract dialog
  const handleCloseContractDialog = () => {
    setOpenContractDialog(false);
    setIsEditingContract(false);
    setSelectedContract(null);
  };
  
  // Handle editing a contract
  const handleEditContract = (contract) => {
    // If editing a contract other than the active one and there's an active or paused one
    if (contracts.some(c => (c.etat === 'Actif' || c.etat === 'Pause') && c.id !== contract.id)) {
      setExistingActiveContract(contracts.find(c => c.etat === 'Actif' || c.etat === 'Pause'));
      setAttemptedAction('edit');
      setSelectedContract(contract);
      setOpenWarningDialog(true);
      return;
    }
    
    setIsEditingContract(true);
    setSelectedContract(contract);
    setContractData({
      id: contract.id,
      date_debut: parse(contract.date_debut, 'dd/MM/yyyy', new Date()),
      date_fin: parse(contract.date_fin, 'dd/MM/yyyy', new Date()),
      montant: contract.montant,
      prix_exces_poids: contract.prix_exces_poids,
      poids_forfait: contract.poids_forfait,
      client_id: contract.client_id,
      etat: contract.etat
    });
    setOpenContractDialog(true);
  };
  
  // Handle submitting the contract
  const handleSubmitContract = async () => {
    try {
      if (!contractData.client_id) {
        showSnackbar('ID client manquant', 'error');
        return;
      }

      if (contractData.montant <= 0) {
        showSnackbar('Le montant doit être supérieur à 0', 'error');
        return;
      }
      
      if (contractData.prix_exces_poids <= 0) {
        showSnackbar('Le prix d\'excès de poids doit être supérieur à 0', 'error');
        return;
      }

      if (contractData.poids_forfait <= 0) {
        showSnackbar('Le poids forfaitaire doit être supérieur à 0', 'error');
        return;
      }

      const formattedContract = {
        ...contractData,
        date_debut: format(new Date(contractData.date_debut), 'dd/MM/yyyy'),
        date_fin: format(new Date(contractData.date_fin), 'dd/MM/yyyy'),
        montant: parseInt(contractData.montant),
        prix_exces_poids: parseInt(contractData.prix_exces_poids),
        poids_forfait: parseInt(contractData.poids_forfait)
      };

      const url = isEditingContract
        ? `${API_URL}/contrats-forfait/${selectedContract.id}`
        : `${API_URL}/contrats-forfait`;
      
      const method = isEditingContract ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedContract),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la création du contrat');
      }

      const savedContract = await response.json();
      
      // Update prix_exces_poids if this is an active contract
      if (savedContract.etat === 'Actif') {
        setPrixExcesPoids(savedContract.prix_exces_poids);
      }
      
      // Refresh contracts list
      await fetchContracts(client.id);
      
      // Update client data to reflect contract changes
      const clientResponse = await fetch(`${API_URL}/clients/${client.id}`);
      if (!clientResponse.ok) {
        throw new Error(`Erreur HTTP: ${clientResponse.status}`);
      }
      const updatedClientData = await clientResponse.json();
      setClient(updatedClientData);
      
      // Update form data with fresh client data
      setFormData({
        ...updatedClientData,
        debut_contrat: updatedClientData.debut_contrat ? parse(updatedClientData.debut_contrat, 'dd/MM/yyyy', new Date()) : null,
        fin_contrat: updatedClientData.fin_contrat ? parse(updatedClientData.fin_contrat, 'dd/MM/yyyy', new Date()) : null
      });

      setContractData({
        date_debut: new Date(),
        date_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        montant: 0,
        prix_exces_poids: 0,
        poids_forfait: 0,
        client_id: client.id,
        etat: 'Actif'
      });
      
      setIsEditingContract(false);
      setSelectedContract(null);
      setOpenContractDialog(false);
      
      showSnackbar(isEditingContract 
        ? 'Contrat modifié avec succès'
        : 'Contrat créé avec succès', 'success');
        
    } catch (error) {
      console.error('Error creating contract:', error);
      showSnackbar(`Erreur lors de la ${isEditingContract ? 'modification' : 'création'} du contrat: ${error.message}`, 'error');
    }
  };
  
  // Handle deleting a contract
  const handleDeleteContract = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/contrats-forfait/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Refresh contracts list
      await fetchContracts(client.id);
      
      // Update client data to reflect contract changes
      const clientResponse = await fetch(`${API_URL}/clients/${client.id}`);
      if (!clientResponse.ok) {
        throw new Error(`Erreur HTTP: ${clientResponse.status}`);
      }
      const updatedClientData = await clientResponse.json();
      setClient(updatedClientData);
      
      // Update form data with fresh client data
      setFormData({
        ...updatedClientData,
        debut_contrat: updatedClientData.debut_contrat ? parse(updatedClientData.debut_contrat, 'dd/MM/yyyy', new Date()) : null,
        fin_contrat: updatedClientData.fin_contrat ? parse(updatedClientData.fin_contrat, 'dd/MM/yyyy', new Date()) : null
      });
      
      showSnackbar('Contrat supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting contract:', error);
      showSnackbar(`Erreur lors de la suppression: ${error.message}`, 'error');
    }
  };

  // Calculate the total amount including excess weight cost
  const calculateTotal = () => {
    // Calculate base amount from consommables
    const baseAmount = bonPassageData.consommables.reduce((sum, item) => {
      const quantity = parseFloat(item.qte) || 0;
      const price = parseFloat(item.prix) || 0;
      return sum + (quantity * price);
    }, 0);
    
    // Get excess weight cost from bonPassageData
    const excesPoids = parseInt(bonPassageData.exces_poids) || 0;
    const coutExcesPoids = excesPoids * prix_exces_poids;
    
    // Return total
    return baseAmount + coutExcesPoids;
  };

  // Open versement dialog for creation
  const handleOpenVersementDialog = () => {
    setSelectedVersement(null);
    setOpenVersementDialog(true);
  };
  
  // Open versement dialog for editing
  const handleEditVersement = (versement) => {
    setSelectedVersement(versement);
    setOpenVersementDialog(true);
  };
  
  // Close versement dialog
  const handleCloseVersementDialog = () => {
    setOpenVersementDialog(false);
    setSelectedVersement(null);
  };
  
  // Save versement (create or update)
  const handleSaveVersement = async (versement, isEdit) => {
    try {
      // Refresh the versements list
      await fetchVersements(client.id);
      
      // Show success message
      showSnackbar(
        isEdit ? 'Versement mis à jour avec succès' : 'Versement créé avec succès', 
        'success'
      );
    } catch (error) {
      console.error('Error handling versement save:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };
  
  // Delete versement
  const handleDeleteVersement = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce versement ?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/versements-forfait/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      // Refresh the versements list
      await fetchVersements(client.id);
      
      showSnackbar('Versement supprimé avec succès', 'success');
    } catch (error) {
      console.error('Error deleting versement:', error);
      showSnackbar(`Erreur lors de la suppression du versement: ${error.message}`, 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !formData) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || "Le client n'a pas été trouvé"}
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToClients}
          sx={{ mt: 2 }}
        >
          Retour à la liste des clients
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBackToClients}
          sx={{ mb: 2 }}
        >
          Retour à la liste des clients
        </Button>
        
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link color="inherit" onClick={handleBackToClients} sx={{ cursor: 'pointer' }}>
            Clients
          </Link>
          <Typography color="text.primary">{formData.nom}</Typography>
        </Breadcrumbs>

        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
          Profil Client - {formData.nom}
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4, width: '100%' }}>
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Client Information - Top Third */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Informations du client
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom"
                  fullWidth
                  margin="normal"
                  value={formData.nom || ''}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  disabled={!editableFields.nom}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('nom')} edge="end">
                          {editableFields.nom ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Spécialité"
                  fullWidth
                  margin="normal"
                  value={formData.specialite || ''}
                  onChange={(e) => handleChange('specialite', e.target.value)}
                  disabled={!editableFields.specialite}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('specialite')} edge="end">
                          {editableFields.specialite ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Téléphone"
                  fullWidth
                  margin="normal"
                  value={formData.tel || ''}
                  onChange={(e) => handleChange('tel', e.target.value)}
                  disabled={!editableFields.tel}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('tel')} edge="end">
                          {editableFields.tel ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="mode-label">Mode (jours)</InputLabel>
                  <Select
                    labelId="mode-label"
                    value={formData.mode || 30}
                    label="Mode (jours)"
                    onChange={(e) => handleChange('mode', e.target.value)}
                    disabled={!editableFields.mode}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('mode')} edge="end" sx={{ mr: 2 }}>
                          {editableFields.mode ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    <MenuItem value={30}>30 jours</MenuItem>
                    <MenuItem value={60}>60 jours</MenuItem>
                    <MenuItem value={90}>90 jours</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="agent-label">Agent</InputLabel>
                  <Select
                    labelId="agent-label"
                    value={formData.agent || ''}
                    label="Agent"
                    onChange={(e) => handleChange('agent', e.target.value)}
                    disabled={!editableFields.agent}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleFieldEdit('agent')} edge="end" sx={{ mr: 2 }}>
                          {editableFields.agent ? <SaveIcon color="primary" /> : <EditIcon sx={{ color: '#FF9800' }} />}
                        </IconButton>
                      </InputAdornment>
                    }
                  >
                    {agents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.nom}>
                        {agent.nom}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel shrink id="etat-contrat-label">État Contrat</InputLabel>
                  <Select
                    labelId="etat-contrat-label"
                    value={formData.etat_contrat || ''}
                    label="État Contrat"
                    onChange={(e) => handleChange('etat_contrat', e.target.value)}
                    disabled={true}
                    IconComponent={() => null}
                    displayEmpty
                    notched
                    renderValue={(value) => value || ' '}
                  >
                    <MenuItem value="">Non défini</MenuItem>
                    <MenuItem value="Actif">Actif</MenuItem>
                    <MenuItem value="Pause">Pause</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Début Contrat"
                    value={formData.debut_contrat}
                    onChange={(newValue) => handleChange('debut_contrat', newValue)}
                    disabled={true}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: 'normal',
                        InputLabelProps: { shrink: true },
                        InputProps: {
                          endAdornment: null,
                          placeholder: ' '
                        }
                      } 
                    }}
                    components={{
                      OpenPickerIcon: () => null
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Fin Contrat"
                    value={formData.fin_contrat}
                    onChange={(newValue) => handleChange('fin_contrat', newValue)}
                    disabled={true}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: 'normal',
                        InputLabelProps: { shrink: true },
                        InputProps: {
                          endAdornment: null,
                          placeholder: ' '
                        }
                      } 
                    }}
                    components={{
                      OpenPickerIcon: () => null
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Tabs - Bottom Two Thirds */}
          <Box sx={{ flexGrow: 1, mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Transactions du client
            </Typography>
            <Paper elevation={0} sx={{ borderBottom: 1, borderLeft: 1, borderRight: 1, borderColor: 'divider' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: 1, 
                borderColor: 'divider'
              }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  aria-label="client information tabs"
                  sx={{ flexGrow: 1 }}
                >
                  <Tab label="Bons de passage" id="tab-0" />
                  <Tab label="Versements" id="tab-1" />
                  <Tab label="Contrats" id="tab-2" />
                </Tabs>
                {tabValue === 0 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mx: 2 }}
                    onClick={handleOpenBonPassageDialog}
                  >
                    Nouveau Bon de passage
                  </Button>
                )}
                {tabValue === 1 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mx: 2 }}
                    onClick={handleOpenVersementDialog}
                  >
                    Nouveau Versement
                  </Button>
                )}
                {tabValue === 2 && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mx: 2 }}
                    onClick={handleOpenContractDialog}
                  >
                    Nouveau Contrat
                  </Button>
                )}
              </Box>
              
              {/* Bons de livraison Tab */}
              <Box
                role="tabpanel"
                hidden={tabValue !== 0}
                id="tabpanel-0"
                aria-labelledby="tab-0"
                sx={{ p: 3, minHeight: '40vh' }}
              >
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={bonsPassage}
                    columns={[
                      { 
                        field: 'date', 
                        headerName: 'Date', 
                        width: 150,
                        headerClassName: 'super-app-theme--header'
                      },
                      { 
                        field: 'poids_collecte', 
                        headerName: 'Poids collecté', 
                        width: 150,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} kg`
                      },
                      { 
                        field: 'exces_poids', 
                        headerName: 'Excès de poids', 
                        width: 150,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} kg`
                      },
                      { 
                        field: 'montant', 
                        headerName: 'Montant', 
                        width: 150,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} DA`
                      },
                      {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 120,
                        headerClassName: 'super-app-theme--header',
                        pinned: 'right',
                        getActions: (params) => [
                          <GridActionsCellItem
                            icon={<VisibilityIcon />}
                            label="Voir"
                            onClick={() => handleViewBonPassage(params.row)}
                            sx={{ color: '#2196F3', ml: 0.5 }}
                          />,
                          <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Supprimer"
                            onClick={() => handleDeleteBonPassage(params.row.id)}
                            sx={{ color: 'red', ml: 0.5 }}
                          />
                        ],
                      }
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    autoHeight
                    disableColumnSelector
                    hideFooterSelectedRowCount
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Box>
              </Box>
              
              {/* Versements Tab */}
              <Box
                role="tabpanel"
                hidden={tabValue !== 1}
                id="tabpanel-1"
                aria-labelledby="tab-1"
                sx={{ p: 3, minHeight: '40vh' }}
              >
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={versements}
                    columns={[
                      { 
                        field: 'date', 
                        headerName: 'Date', 
                        width: 150,
                        headerClassName: 'super-app-theme--header'
                      },
                      { 
                        field: 'montant', 
                        headerName: 'Montant', 
                        width: 150,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} DA`
                      },
                      {
                        field: 'contrat_id',
                        headerName: 'Contrat',
                        width: 250,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        renderCell: (params) => {
                          const contract = contracts.find(c => c.id === params.value);
                          return contract 
                            ? `Du ${contract.date_debut} au ${contract.date_fin}`
                            : `Contrat ID: ${params.value}`;
                        }
                      },
                      {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 120,
                        headerClassName: 'super-app-theme--header',
                        pinned: 'right',
                        getActions: (params) => [
                          <GridActionsCellItem
                            icon={<EditIcon />}
                            label="Modifier"
                            onClick={() => handleEditVersement(params.row)}
                            sx={{ color: '#FF9800', ml: 0.5 }}
                          />,
                          <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Supprimer"
                            onClick={() => handleDeleteVersement(params.row.id)}
                            sx={{ color: 'red', ml: 0.5 }}
                          />
                        ],
                      }
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    autoHeight
                    disableColumnSelector
                    hideFooterSelectedRowCount
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Box>
              </Box>
              
              {/* Contrats Tab */}
              <Box
                role="tabpanel"
                hidden={tabValue !== 2}
                id="tabpanel-2"
                aria-labelledby="tab-2"
                sx={{ p: 3, minHeight: '40vh' }}
              >
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={contracts}
                    columns={[
                      { 
                        field: 'date_debut', 
                        headerName: 'Date début', 
                        width: 150,
                        headerClassName: 'super-app-theme--header'
                      },
                      { 
                        field: 'date_fin', 
                        headerName: 'Date fin', 
                        width: 150,
                        headerClassName: 'super-app-theme--header'
                      },
                      { 
                        field: 'montant', 
                        headerName: 'Montant', 
                        width: 150,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} DA`
                      },
                      { 
                        field: 'prix_exces_poids', 
                        headerName: 'Prix excès poids', 
                        width: 150,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} DA/kg`
                      },
                      { 
                        field: 'poids_forfait', 
                        headerName: 'Poids forfait', 
                        width: 150,
                        flex: 1,
                        headerClassName: 'super-app-theme--header',
                        valueFormatter: (params) => `${params.value} kg`
                      },
                      { 
                        field: 'etat', 
                        headerName: 'État', 
                        width: 120,
                        headerClassName: 'super-app-theme--header',
                        renderCell: (params) => {
                          let color;
                          switch (params.value) {
                            case 'Actif':
                              color = 'green';
                              break;
                            case 'Pause':
                              color = 'orange';
                              break;
                            case 'Terminé':
                              color = 'red';
                              break;
                            default:
                              color = 'inherit';
                          }
                          return <span style={{ color }}>{params.value}</span>;
                        }
                      },
                      {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 120,
                        headerClassName: 'super-app-theme--header',
                        pinned: 'right',
                        getActions: (params) => [
                          params.row.etat !== 'Terminé' ? 
                            <GridActionsCellItem
                              icon={<EditIcon />}
                              label="Modifier"
                              onClick={() => handleEditContract(params.row)}
                              sx={{ color: '#FF9800', ml: 0.5 }}
                            /> :
                            <GridActionsCellItem
                              icon={<span style={{ width: 24, display: 'inline-block' }}></span>}
                              label=""
                              onClick={() => {}}
                              disabled
                              sx={{ ml: 0.5, opacity: 0 }}
                            />,
                          <GridActionsCellItem
                            icon={<DeleteIcon />}
                            label="Supprimer"
                            onClick={() => handleDeleteContract(params.row.id)}
                            sx={{ color: 'red', ml: 0.5 }}
                          />
                        ],
                      }
                    ]}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    autoHeight
                    disableColumnSelector
                    hideFooterSelectedRowCount
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog for creating a new bon de passage */}
      <Dialog 
        open={openBonPassageDialog} 
        onClose={handleCloseBonPassageDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Nouveau bon de passage</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <DatePicker
                label="Date"
                value={bonPassageData.date}
                onChange={(newValue) => setBonPassageData({ ...bonPassageData, date: newValue })}
                slotProps={{ 
                  textField: { 
                    fullWidth: true, 
                        margin: "normal"
                  } 
                }}
              />
            </LocalizationProvider>
              </Grid>
              
              {/* Poids collecté */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Poids collecté (kg)"
                  value={bonPassageData.poids_collecte}
                  onChange={(e) => {
                    const poidsCollecte = parseInt(e.target.value) || 0;
                    // Get contract's poids_forfait (from the active contract)
                    const activeContract = contracts.find(c => c.etat === 'Actif');
                    const poidsForfait = activeContract ? activeContract.poids_forfait : 0;
                    // Calculate excess weight
                    const excesPoids = Math.max(0, poidsCollecte - poidsForfait);
                    
                    setBonPassageData({
                      ...bonPassageData,
                      poids_collecte: e.target.value,
                      exces_poids: excesPoids
                    });
                  }}
                  type="number"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  helperText="Poids total des déchets collectés"
                />
              </Grid>
              
              {/* Excès de poids */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Excès de poids (kg)"
                  value={bonPassageData.exces_poids}
                  type="number"
                  fullWidth
                  margin="normal"
                  disabled
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  helperText="Calculé automatiquement selon le poids collecté et le forfait"
                />
              </Grid>
              
              {/* Display cost of excess weight */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Coût excès de poids"
                  value={`${(parseInt(bonPassageData.exces_poids) || 0) * prix_exces_poids} DA`}
                  fullWidth
                  margin="normal"
                  disabled
                  helperText={`${prix_exces_poids} DA par kg (selon contrat actif)`}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* Consommables Table */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Consommables</Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Qté</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Prix</TableCell>
                    <TableCell align="center" sx={{ width: '50px', p: 0 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bonPassageData.consommables.map((consommable, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          autoSelect
                          options={produits.map(p => p.designation)}
                          value={consommable.produit}
                          onChange={(event, newValue) => handleConsommableChange(index, 'produit', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Nom du produit"
                              variant="standard"
                              fullWidth
                            />
                          )}
                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            const filtered = options.filter(option => 
                              option.toLowerCase().includes(inputValue.toLowerCase())
                            );
                            return filtered;
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={consommable.qte}
                          onChange={(e) => handleConsommableChange(index, 'qte', e.target.value)}
                          placeholder="Qté"
                          variant="standard"
                          inputProps={{ min: "0.1", step: "0.1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={consommable.prix}
                          onChange={(e) => handleConsommableChange(index, 'prix', e.target.value)}
                          placeholder="Prix"
                          variant="standard"
                          inputProps={{ min: "1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: '50px', p: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteConsommable(index)}
                          sx={{ color: 'red' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddConsommable}
                variant="outlined"
                size="small"
              >
                Ajouter un consommable
              </Button>
            </Box>
          </Box>
          
          {/* Services Table */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Services</Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Qté (optionnelle)</TableCell>
                    <TableCell align="center" sx={{ width: '50px', p: 0 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bonPassageData.services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          autoSelect
                          options={servicesData.map(s => s.designation)}
                          value={service.service}
                          onChange={(event, newValue) => handleServiceChange(index, 'service', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Nom du service"
                              variant="standard"
                              fullWidth
                            />
                          )}
                          filterOptions={(options, params) => {
                            const { inputValue } = params;
                            const filtered = options.filter(option => 
                              option.toLowerCase().includes(inputValue.toLowerCase())
                            );
                            return filtered;
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={service.qte}
                          onChange={(e) => handleServiceChange(index, 'qte', e.target.value)}
                          placeholder="Qté"
                          variant="standard"
                          inputProps={{ min: "0.1", step: "0.1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: '50px', p: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteService(index)}
                          sx={{ color: 'red' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddService}
                variant="outlined"
                size="small"
              >
                Ajouter un service
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Total: {calculateTotal().toLocaleString()} DA
            </Typography>
            <Box>
          <Button onClick={handleCloseBonPassageDialog}>Annuler</Button>
              <Button 
                onClick={handleSubmitBonPassage} 
                variant="contained"
                color="primary"
              >
                Enregistrer
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog for viewing an existing bon de passage */}
      <Dialog 
        open={openViewBonPassageDialog} 
        onClose={handleCloseViewBonPassageDialog} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Voir Bon de passage</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                  <DatePicker
                    label="Date"
                    value={bonPassageData.date}
                    onChange={(newValue) => setBonPassageData({ ...bonPassageData, date: newValue })}
                    slotProps={{ 
                      textField: { 
                        fullWidth: true, 
                        margin: "normal"
                      } 
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Poids collecté (kg)"
                  value={bonPassageData.poids_collecte}
                  onChange={(e) => {
                    const poidsCollecte = parseInt(e.target.value) || 0;
                    // Get contract's poids_forfait (from the active contract)
                    const activeContract = contracts.find(c => c.etat === 'Actif');
                    const poidsForfait = activeContract ? activeContract.poids_forfait : 0;
                    // Calculate excess weight
                    const excesPoids = Math.max(0, poidsCollecte - poidsForfait);
                    
                    setBonPassageData({
                      ...bonPassageData,
                      poids_collecte: e.target.value,
                      exces_poids: excesPoids
                    });
                  }}
                  type="number"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Excès de poids (kg)"
                  value={bonPassageData.exces_poids}
                  type="number"
                  fullWidth
                  margin="normal"
                  disabled
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                  helperText="Calculé automatiquement selon le poids collecté et le forfait"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Coût excès de poids"
                  value={`${(parseInt(bonPassageData.exces_poids) || 0) * prix_exces_poids} DA`}
                  fullWidth
                  margin="normal"
                  disabled
                  helperText={`${prix_exces_poids} DA par kg (selon contrat actif)`}
                />
              </Grid>
            </Grid>
          </Box>
          
          {/* Consommables Table */}
          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Consommables</Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Produit</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Qté</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Prix</TableCell>
                    <TableCell align="center" sx={{ width: '50px', p: 0 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bonPassageData.consommables.map((consommable, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          autoSelect
                          options={produits.map(p => p.designation)}
                          value={consommable.produit}
                          onChange={(event, newValue) => handleConsommableChange(index, 'produit', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Nom du produit"
                              variant="standard"
                              fullWidth
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={consommable.qte}
                          onChange={(e) => handleConsommableChange(index, 'qte', e.target.value)}
                          placeholder="Qté"
                          variant="standard"
                          inputProps={{ min: "0.1", step: "0.1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={consommable.prix}
                          onChange={(e) => handleConsommableChange(index, 'prix', e.target.value)}
                          placeholder="Prix"
                          variant="standard"
                          inputProps={{ min: "1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: '50px', p: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteConsommable(index)}
                          sx={{ color: 'red' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddConsommable}
                variant="outlined"
                size="small"
              >
                Ajouter un consommable
              </Button>
            </Box>
          </Box>
          
          {/* Services Table */}
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">Services</Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="center" sx={{ px: 1, width: '100px' }}>Qté (optionnelle)</TableCell>
                    <TableCell align="center" sx={{ width: '50px', p: 0 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bonPassageData.services.map((service, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          freeSolo
                          autoSelect
                          options={servicesData.map(s => s.designation)}
                          value={service.service}
                          onChange={(event, newValue) => handleServiceChange(index, 'service', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              placeholder="Nom du service"
                              variant="standard"
                              fullWidth
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ px: 1 }}>
                        <TextField
                          type="number"
                          value={service.qte}
                          onChange={(e) => handleServiceChange(index, 'qte', e.target.value)}
                          placeholder="Qté"
                          variant="standard"
                          inputProps={{ min: "0.1", step: "0.1" }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ width: '50px', p: 0 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteService(index)}
                          sx={{ color: 'red' }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddService}
                variant="outlined"
                size="small"
              >
                Ajouter un service
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Total: {calculateTotal().toLocaleString()} DA
            </Typography>
            <Box>
              <Button onClick={handleCloseViewBonPassageDialog}>Annuler</Button>
              <Button 
                onClick={handleModifyBonPassage} 
                variant="contained"
                color="primary"
              >
                Modifier
              </Button>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Dialog for creating or editing a contract */}
      <Dialog
        open={openContractDialog}
        onClose={handleCloseContractDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{isEditingContract ? 'Modifier le contrat' : 'Nouveau contrat'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date début"
                  value={contractData.date_debut}
                  onChange={(newValue) => setContractData({ ...contractData, date_debut: newValue })}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      margin: 'normal'
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DatePicker
                  label="Date fin"
                  value={contractData.date_fin}
                  onChange={(newValue) => setContractData({ ...contractData, date_fin: newValue })}
                  slotProps={{ 
                    textField: { 
                      fullWidth: true, 
                      margin: 'normal'
                    } 
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Montant (DA)"
                type="number"
                value={contractData.montant}
                onChange={(e) => setContractData({ ...contractData, montant: e.target.value })}
                fullWidth
                margin="normal"
                inputProps={{ min: "1" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Prix excès de poids (DA/kg)"
                type="number"
                value={contractData.prix_exces_poids}
                onChange={(e) => setContractData({ ...contractData, prix_exces_poids: e.target.value })}
                fullWidth
                margin="normal"
                inputProps={{ min: "1" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Poids forfait (kg)"
                type="number"
                value={contractData.poids_forfait}
                onChange={(e) => setContractData({ ...contractData, poids_forfait: e.target.value })}
                fullWidth
                margin="normal"
                inputProps={{ min: "1" }}
              />
            </Grid>
            {isEditingContract && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="etat-contract-label">État</InputLabel>
                  <Select
                    labelId="etat-contract-label"
                    id="etat-contract"
                    value={contractData.etat}
                    label="État"
                    onChange={(e) => setContractData({ ...contractData, etat: e.target.value })}
                  >
                    <MenuItem value="Actif">Actif</MenuItem>
                    <MenuItem value="Pause">Pause</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContractDialog}>Annuler</Button>
          <Button onClick={handleSubmitContract} variant="contained">
            {isEditingContract ? 'Modifier' : 'Créer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning dialog for existing active contract */}
      <Dialog
        open={openWarningDialog}
        onClose={handleCloseWarningDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {attemptedAction === 'bonPassagePause' 
            ? 'Contrat en pause' 
            : 'Contrat actif ou en pause existant'}
        </DialogTitle>
        <DialogContent>
          {attemptedAction === 'bonPassagePause' ? (
            <Typography variant="body1" sx={{ mb: 2 }}>
              Vous ne pouvez pas créer un bon de passage car le contrat du client est actuellement en pause.
              <br /><br />
              Veuillez d'abord réactiver le contrat avant de créer un bon de passage.
            </Typography>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {attemptedAction === 'create' 
                  ? "Vous ne pouvez pas créer un nouveau contrat car il existe déjà un contrat actif ou en pause pour ce client."
                  : "Vous ne pouvez pas modifier ce contrat car il existe déjà un contrat actif ou en pause pour ce client."}
              </Typography>
              
              {existingActiveContract && (
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Contrat {existingActiveContract.etat}:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Date début:</strong> {existingActiveContract.date_debut}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Date fin:</strong> {existingActiveContract.date_fin}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Montant:</strong> {existingActiveContract.montant} DA
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Prix excès:</strong> {existingActiveContract.prix_exces_poids} DA/kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Poids forfait:</strong> {existingActiveContract.poids_forfait} kg
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>État:</strong> {existingActiveContract.etat}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
              
              <Typography variant="body1">
                Vous devez d'abord mettre à l'état "Terminé" le contrat existant avant de {attemptedAction === 'create' ? 'créer un nouveau contrat' : 'modifier celui-ci'}.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseWarningDialog}
            variant="contained" 
            color="primary"
          >
            {attemptedAction === 'bonPassagePause' ? 'Compris' : 'Annuler'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning dialog for creating bon passage without active contract */}
      <Dialog
        open={openBonPassageWarningDialog}
        onClose={handleCloseBonPassageWarningDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Aucun contrat actif</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Vous ne pouvez pas créer un bon de passage car ce client n'a pas de contrat actif.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Information</AlertTitle>
            Un contrat actif est nécessaire pour créer un bon de passage. Veuillez d'abord créer un contrat pour ce client.
          </Alert>
          
          <Typography variant="body1">
            Veuillez créer un contrat pour ce client avant de créer un bon de passage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseBonPassageWarningDialog}
            variant="contained" 
            color="primary"
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Versement Dialog */}
      <VersementForfaitDialog
        open={openVersementDialog}
        onClose={handleCloseVersementDialog}
        clientId={client?.id}
        versement={selectedVersement}
        onSave={handleSaveVersement}
        contracts={contracts}
      />
    </Container>
  );
};

export default ClientProfile; 