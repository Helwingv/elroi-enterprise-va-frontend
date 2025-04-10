import { Stethoscope, ExternalLink, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseUser } from '../hooks/useSupabaseUser';
import AddProviderModal from '../components/AddProviderModal';
import ProviderDetailsModal from '../components/ProviderDetailsModal'; 
import ProviderAccessModal from '../components/ProviderAccessModal';

interface Provider {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'inactive';
  dataTypes: string[];
  lastSync: string;
  logo: string;
  permissions: {
    labResults: boolean;
    medications: boolean;
    fitnessData: boolean;
  };
}

const initialProviders: Provider[] = [
  {
    id: '1',
    name: 'Memorial Hospital',
    category: 'Healthcare Provider',
    status: 'active',
    dataTypes: ['Medical Records', 'Lab Results', 'Prescriptions'],
    lastSync: '2024-03-15T10:30:00Z',
    logo: '/elroi-logo.svg',
    permissions: {
      labResults: true,
      medications: true,
      fitnessData: true
    }
  },
  {
    id: '2',
    name: 'HealthTrack Pharmacy',
    category: 'Pharmacy',
    status: 'pending',
    dataTypes: ['Medication History', 'Prescription Records', 'Insurance Claims'],
    lastSync: '2024-03-14T15:45:00Z',
    logo: '/elroi-logo.svg',
    permissions: {
      labResults: false,
      medications: true,
      fitnessData: true
    }
  },
  {
    id: '3',
    name: 'Wellness Center',
    category: 'Fitness & Wellness',
    status: 'inactive',
    dataTypes: ['Fitness Metrics', 'Nutrition Data', 'Wellness Assessments'],
    lastSync: '2024-03-13T09:15:00Z',
    logo: '/elroi-logo.svg',
    permissions: {
      labResults: true,
      medications: false,
      fitnessData: true
    }
  },
];

export default function Providers() {
  const [providersList, setProvidersList] = useState<Provider[]>(initialProviders);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const { userData } = useSupabaseUser();

  const handleAddProvider = async (newProvider: {
    name: string;
    category: string;
    dataTypes: string[];
  }) => {
    // Generate a new ID for the provider
    const providerId = Math.random().toString(36).substr(2, 9);
    
    // Create a new provider object
    const provider: Provider = {
      id: providerId,
      name: newProvider.name,
      category: newProvider.category,
      status: 'pending',
      dataTypes: newProvider.dataTypes,
      lastSync: new Date().toISOString(),
      logo: '/elroi-logo.svg',
      permissions: {
        labResults: false,
        medications: false,
        fitnessData: false
      }
    };

    // Add provider to UI
    setProvidersList(prev => [...prev, provider]);

    // If we have a logged in user, add consent record to Supabase
    if (userData?.id) {
      try {
        const { error } = await supabase
          .from('user_provider_consent')
          .insert({
            user_id: userData.id,
            provider_id: providerId,
            approved: false
          });

        if (error) {
          console.error('Error creating consent record:', error);
        }
      } catch (error) {
        console.error('Failed to create consent record:', error);
      }
    }
  };

  const openDetailsModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsDetailsModalOpen(true);
  };

  const openAccessModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setIsAccessModalOpen(true);
  };

  const handleUpdatePermissions = async (providerId: string, permissions: { [key: string]: boolean }) => {
    // Update the UI first
    setProvidersList(prev => prev.map(provider => 
      provider.id === providerId
        ? { ...provider, permissions }
        : provider
    ));

    // If we have a logged in user, update the consent in Supabase
    if (userData?.id) {
      try {
        const { error } = await supabase
          .from('user_provider_consent')
          .upsert({
            user_id: userData.id,
            provider_id: providerId,
            approved: true, // Set to true when permissions are updated
            lab_results: permissions.labResults,
            medications: permissions.medications,
            fitness_data: permissions.fitnessData
          });

        if (error) {
          console.error('Error updating provider permissions:', error);
        }
      } catch (error) {
        console.error('Failed to update provider permissions:', error);
      }
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    // Remove from UI
    setProvidersList(prev => prev.filter(provider => provider.id !== providerId));
    setIsAccessModalOpen(false);

    // If user is logged in, delete from Supabase
    if (userData?.id) {
      try {
        const { error } = await supabase
          .from('user_provider_consent')
          .delete()
          .eq('user_id', userData.id)
          .eq('provider_id', providerId);

        if (error) {
          console.error('Error deleting provider consent:', error);
        }
      } catch (error) {
        console.error('Failed to delete provider consent:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Data Providers</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add New Provider
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {providersList.map((provider) => (
          <div
            key={provider.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{provider.name}</h3>
                  <p className="text-sm text-gray-500">{provider.category}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      provider.status === 'active' ? 'bg-green-100 text-green-800' :
                      provider.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Last synced: {new Date(provider.lastSync).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Shield className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <ExternalLink className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Data Types</h4>
              <div className="flex flex-wrap gap-2">
                {provider.dataTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button 
                onClick={() => openDetailsModal(provider)}
                className="flex-1 bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button 
                onClick={() => openAccessModal(provider)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Access
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddProvider}
      />
      
      {selectedProvider && (
        <ProviderDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          provider={selectedProvider}
        />
      )}
      
      {selectedProvider && (
        <ProviderAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          provider={selectedProvider}
          onUpdatePermissions={handleUpdatePermissions}
          onDeleteProvider={handleDeleteProvider}
        />
      )}
    </div>
  );
}