import React, { useState, useEffect } from 'react';
import { Heart, Activity, Trophy, Sparkles, Mountain, Settings, LogOut } from 'lucide-react';

// Simulated OAuth - In production, replace with actual OAuth flows
const STRAVA_CLIENT_ID = 'your_strava_client_id';
const GOOGLE_CLIENT_ID = 'your_google_client_id';
const REDIRECT_URI = window.location.origin;

const RunningCompanion = () => {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [activities, setActivities] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage
  useEffect(() => {
    loadUserData();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (user) {
      saveUserData();
    }
  }, [user, character, activities, inventory]);

  // Daily health degradation check
  useEffect(() => {
    if (character) {
      const timer = setInterval(checkCharacterHealth, 60000); // Check every minute
      return () => clearInterval(timer);
    }
  }, [character, activities]);

  const loadUserData = async () => {
    try {
      const userData = await window.storage.get('user-profile');
      const charData = await window.storage.get('character-state');
      const actData = await window.storage.get('activities-log');
      const invData = await window.storage.get('inventory-items');
      
      if (userData?.value) setUser(JSON.parse(userData.value));
      if (charData?.value) setCharacter(JSON.parse(charData.value));
      if (actData?.value) setActivities(JSON.parse(actData.value));
      if (invData?.value) setInventory(JSON.parse(invData.value));
    } catch (error) {
      console.log('No previous data found, starting fresh');
    }
    setIsLoading(false);
  };

  const saveUserData = async () => {
    try {
      if (user) await window.storage.set('user-profile', JSON.stringify(user));
      if (character) await window.storage.set('character-state', JSON.stringify(character));
      if (activities) await window.storage.set('activities-log', JSON.stringify(activities));
      if (inventory) await window.storage.set('inventory-items', JSON.stringify(inventory));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const checkCharacterHealth = () => {
    if (!character || !activities.length) return;

    const lastActivity = activities[activities.length - 1];
    const daysSinceActivity = Math.floor((Date.now() - lastActivity.date) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity >= 3 && character.health > 0) {
      const healthLoss = Math.min(10, character.health);
      setCharacter(prev => ({
        ...prev,
        health: Math.max(0, prev.health - healthLoss),
        mood: prev.health - healthLoss <= 0 ? 'dead' : prev.health - healthLoss < 30 ? 'sad' : 'neutral'
      }));
    }
  };

  const handleStravaLogin = () => {
    // In production, implement actual OAuth flow
    const mockUser = {
      id: 'strava_' + Date.now(),
      name: 'Nordic Runner',
      email: 'runner@strava.com',
      provider: 'strava',
      avatar: null
    };
    
    const newCharacter = generateCharacter();
    setUser(mockUser);
    setCharacter(newCharacter);
  };

  const handleGoogleLogin = () => {
    // In production, implement actual OAuth flow
    const mockUser = {
      id: 'google_' + Date.now(),
      name: 'Mountain Explorer',
      email: 'explorer@gmail.com',
      provider: 'google',
      avatar: null
    };
    
    const newCharacter = generateCharacter();
    setUser(mockUser);
    setCharacter(newCharacter);
  };

  const generateCharacter = () => {
    const themes = ['viking', 'fjord', 'aurora', 'frost'];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    
    return {
      name: generateNordicName(),
      theme,
      health: 100,
      level: 1,
      mood: 'happy',
      createdAt: Date.now(),
      lastFed: Date.now(),
      customization: {
        hat: null,
        accessory: null,
        pattern: null
      }
    };
  };

  const generateNordicName = () => {
    const prefixes = ['Bjorn', 'Freya', 'Thor', 'Astrid', 'Erik', 'Liv', 'Odin', 'Saga'];
    const suffixes = ['son', 'dottir', 'berg', 'heim', 'dal', 'fjord'];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + 
           suffixes[Math.floor(Math.random() * suffixes.length)];
  };

  const logActivity = (distance, duration) => {
    const newActivity = {
      id: Date.now(),
      date: Date.now(),
      distance: parseFloat(distance),
      duration: parseInt(duration),
      itemFound: Math.random() > 0.7 ? generateItem() : null
    };

    const updatedActivities = [...activities, newActivity];
    setActivities(updatedActivities);

    // Calculate streak
    const streak = calculateStreak(updatedActivities);

    // Update character
    setCharacter(prev => ({
      ...prev,
      health: Math.min(100, prev.health + 10),
      level: Math.floor(updatedActivities.length / 5) + 1,
      mood: 'happy',
      lastFed: Date.now()
    }));

    // Add item to inventory if found
    if (newActivity.itemFound) {
      setInventory(prev => [...prev, newActivity.itemFound]);
    }

    return newActivity;
  };

  const calculateStreak = (acts) => {
    if (acts.length === 0) return 0;
    
    let streak = 1;
    const sortedActs = [...acts].sort((a, b) => b.date - a.date);
    
    for (let i = 0; i < sortedActs.length - 1; i++) {
      const daysDiff = Math.floor((sortedActs[i].date - sortedActs[i + 1].date) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const generateItem = () => {
    const items = [
      { id: 'viking_helm', name: 'Viking Helm', rarity: 'rare', type: 'hat' },
      { id: 'aurora_scarf', name: 'Aurora Scarf', rarity: 'rare', type: 'accessory' },
      { id: 'rune_stone', name: 'Rune Stone', rarity: 'rare', type: 'accessory' },
      { id: 'frost_cape', name: 'Frost Cape', rarity: 'rare', type: 'accessory' },
      { id: 'nordic_pattern', name: 'Nordic Pattern', rarity: 'common', type: 'pattern' },
      { id: 'mountain_badge', name: 'Mountain Badge', rarity: 'common', type: 'accessory' },
      { id: 'fjord_shell', name: 'Fjord Shell', rarity: 'common', type: 'accessory' },
      { id: 'pine_cone', name: 'Pine Cone', rarity: 'common', type: 'accessory' },
      { id: 'moss_patch', name: 'Moss Patch', rarity: 'common', type: 'pattern' },
      { id: 'deer_antler', name: 'Deer Antler', rarity: 'rare', type: 'hat' },
      { id: 'forest_crown', name: 'Forest Crown', rarity: 'rare', type: 'hat' }
    ];
    
    return {
      ...items[Math.floor(Math.random() * items.length)],
      foundAt: Date.now()
    };
  };

  const applyItem = (item) => {
    setCharacter(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [item.type]: item
      }
    }));
  };

  const handleLogout = async () => {
    await window.storage.delete('user-profile');
    await window.storage.delete('character-state');
    await window.storage.delete('activities-log');
    await window.storage.delete('inventory-items');
    setUser(null);
    setCharacter(null);
    setActivities([]);
    setInventory([]);
  };

  if (isLoading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading your companion...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onStravaLogin={handleStravaLogin} onGoogleLogin={handleGoogleLogin} />;
  }

  return (
    <div style={styles.app}>
      <Header user={user} onLogout={handleLogout} onSettings={() => setShowSettings(true)} />
      
      <div style={styles.mainContent}>
        <CharacterDisplay character={character} />
        
        <div style={styles.statsPanel}>
          <StatCard
            icon={<Activity size={24} />}
            label="Total Runs"
            value={activities.length}
            color="#40916C"
          />
          <StatCard
            icon={<Mountain size={24} />}
            label="Current Streak"
            value={calculateStreak(activities) + " days"}
            color="#2D6A4F"
          />
          <StatCard
            icon={<Trophy size={24} />}
            label="Level"
            value={character.level}
            color="#D4A574"
          />
          <StatCard
            icon={<Sparkles size={24} />}
            label="Rare Items"
            value={inventory.filter(i => i.rarity !== 'common').length}
            color="#74A57F"
          />
        </div>

        <TrackerConnection user={user} activities={activities} onLog={logActivity} />
        
        <Inventory items={inventory} onApply={applyItem} appliedItems={character.customization} />
        
        <RecentActivities activities={activities.slice(-5).reverse()} />
      </div>

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          character={character}
          activities={activities}
        />
      )}
    </div>
  );
};

const LoginScreen = ({ onStravaLogin, onGoogleLogin }) => {
  return (
    <div style={styles.loginScreen}>
      <div style={styles.loginNorthernLights}></div>
      
      <div style={styles.loginContent}>
        <div style={styles.loginHeader}>
          <Mountain size={64} style={{ color: '#2C3E50' }} />
          <h1 style={styles.loginTitle}>Konsekvens</h1>
          <p style={styles.loginSubtitle}>
            Your running companion that grows with each activity. Consistent running. Consistent rewards.
          </p>
        </div>

        <div style={styles.loginButtons}>
          <button style={{...styles.loginButton, ...styles.stravaButton}} onClick={onStravaLogin}>
            <Activity size={20} />
            <span>Log In with Strava</span>
          </button>
          
          <button style={{...styles.loginButton, ...styles.googleButton}} onClick={onGoogleLogin}>
            <span style={styles.googleIcon}>G</span>
            <span>Log In with Google</span>
          </button>
        </div>

        <p style={styles.loginFooter}>
          Consistency awaits.
        </p>
      </div>
    </div>
  );
};

const Header = ({ user, onLogout, onSettings }) => {
  return (
    <header style={styles.header}>
      <div style={styles.headerLeft}>
        <Mountain size={32} style={{ color: '#1B4332' }} />
        <h1 style={styles.headerTitle}>Konsekvens</h1>
      </div>
      
      <div style={styles.headerRight}>
        <span style={styles.userName}>{user.name}</span>
        <button style={styles.iconButton} onClick={onSettings} title="Settings">
          <Settings size={20} />
        </button>
        <button style={styles.iconButton} onClick={onLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};

const CharacterDisplay = ({ character }) => {
  const [animationFrame, setAnimationFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame(prev => (prev + 1) % 2);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPixelCreature = () => {
    const baseColor = character.theme === 'viking' ? '#8B4513' :
                     character.theme === 'fjord' ? '#4682B4' :
                     character.theme === 'aurora' ? '#9370DB' :
                     '#52796F';
    
    const isDead = character.health === 0;
    const isSad = character.health < 30;
    const bodyColor = isDead ? '#666' : baseColor;
    const eyeColor = isDead ? '#444' : '#000';

    // Simple creature with 4 limbs and idle animation
    return (
      <div style={styles.pixelCreature}>
        {/* Head/Body integrated */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={styles.emptyPixel}></div>
        </div>
        
        {/* Eyes row */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{...styles.creaturePixel, background: eyeColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: eyeColor}}></div>
          <div style={styles.emptyPixel}></div>
        </div>
        
        {/* Mouth row */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: isSad || isDead ? bodyColor : eyeColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={styles.emptyPixel}></div>
        </div>
        
        {/* Upper body */}
        <div style={styles.creatureRow}>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
        </div>
        
        {/* Mid body with arms */}
        <div style={styles.creatureRow}>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
        </div>
        
        {/* Lower body */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={{...styles.creaturePixel, background: bodyColor}}></div>
          <div style={styles.emptyPixel}></div>
        </div>
        
        {/* Legs - animate with idle movement */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{
            ...styles.creaturePixel, 
            background: bodyColor,
            transform: animationFrame === 0 ? 'translateY(0)' : 'translateY(2px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={styles.emptyPixel}></div>
          <div style={{
            ...styles.creaturePixel, 
            background: bodyColor,
            transform: animationFrame === 1 ? 'translateY(0)' : 'translateY(2px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={styles.emptyPixel}></div>
        </div>
        
        {/* Feet */}
        <div style={styles.creatureRow}>
          <div style={styles.emptyPixel}></div>
          <div style={{
            ...styles.creaturePixel, 
            background: bodyColor,
            transform: animationFrame === 0 ? 'translateY(0)' : 'translateY(2px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={styles.emptyPixel}></div>
          <div style={{
            ...styles.creaturePixel, 
            background: bodyColor,
            transform: animationFrame === 1 ? 'translateY(0)' : 'translateY(2px)',
            transition: 'transform 0.3s ease'
          }}></div>
          <div style={styles.emptyPixel}></div>
        </div>
      </div>
    );
  };

  const daysSinceLastActivity = character.lastFed 
    ? Math.floor((Date.now() - character.lastFed) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div style={styles.tamagotchiScreen}>
      <div style={styles.screenBorder}>
        <div style={styles.screenInner}>
          {/* Character name at top */}
          <div style={styles.screenHeader}>
            <span style={styles.screenCharacterName}>{character.name}</span>
            <span style={styles.screenLevel}>Lv.{character.level}</span>
          </div>
          
          {/* Main creature display */}
          <div style={styles.creatureDisplay}>
            {getPixelCreature()}
          </div>
          
          {/* Status indicators */}
          <div style={styles.statusIcons}>
            <div style={styles.statusIcon}>
              <Heart size={16} style={{ color: character.health > 70 ? '#40916C' : character.health > 30 ? '#F4A259' : '#E63946' }} />
            </div>
            <div style={styles.statusIcon}>
              <Activity size={16} style={{ color: '#40916C' }} />
            </div>
            <div style={styles.statusIcon}>
              <Trophy size={16} style={{ color: '#D4A574' }} />
            </div>
          </div>
          
          {/* Health bar */}
          <div style={styles.screenHealthBar}>
            <div style={styles.screenHealthLabel}>Health</div>
            <div style={styles.screenHealthBarBg}>
              <div 
                style={{
                  ...styles.screenHealthBarFill,
                  width: `${character.health}%`,
                  background: character.health > 70 ? '#40916C' :
                             character.health > 30 ? '#F4A259' : '#E63946'
                }}
              ></div>
            </div>
            <div style={styles.screenHealthValue}>{character.health}%</div>
          </div>
          
          {/* Warning messages */}
          {daysSinceLastActivity > 0 && (
            <div style={styles.screenWarning}>
              {daysSinceLastActivity === 1 && '! Feed me soon !'}
              {daysSinceLastActivity === 2 && '!! Very hungry !!'}
              {daysSinceLastActivity >= 3 && '!!! CRITICAL !!!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: color + '20', color }}>{icon}</div>
      <div style={styles.statInfo}>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
};

const TrackerConnection = ({ user, activities, onLog }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [newActivities, setNewActivities] = useState([]);

  useEffect(() => {
    loadLastSync();
  }, []);

  const loadLastSync = async () => {
    try {
      const syncData = await window.storage.get('last-sync-time');
      if (syncData?.value) setLastSync(parseInt(syncData.value));
    } catch (error) {
      console.log('No sync data found');
    }
  };

  const handleSync = async () => {
    setIsConnecting(true);
    setNewActivities([]);
    
    // Simulate API call to fetch activities from Strava/health tracker
    setTimeout(() => {
      // Simulate finding new activities (in production, this would be from the API)
      const shouldFindActivity = Math.random() > 0.3;
      
      if (shouldFindActivity) {
        const distances = [3.2, 5.0, 7.5, 10.0, 12.5, 15.0];
        const durations = [20, 30, 45, 60, 75, 90];
        
        const randomDistance = distances[Math.floor(Math.random() * distances.length)];
        const randomDuration = durations[Math.floor(Math.random() * durations.length)];
        
        const activity = onLog(randomDistance, randomDuration);
        setNewActivities([activity]);
      }
      
      const newSyncTime = Date.now();
      setLastSync(newSyncTime);
      window.storage.set('last-sync-time', newSyncTime.toString());
      setIsConnecting(false);
      
      // Clear notification after 4 seconds
      setTimeout(() => setNewActivities([]), 4000);
    }, 2000);
  };

  const getTrackerName = () => {
    if (user.provider === 'strava') return 'Strava';
    return 'Health Tracker';
  };

  const getTrackerOptions = () => {
    if (user.provider === 'strava') return null;
    
    return (
      <div style={styles.trackerOptions}>
        <p style={styles.trackerPrompt}>Connect a health tracker to sync your runs:</p>
        <div style={styles.trackerButtons}>
          <button style={styles.trackerButton}>
            <Activity size={18} />
            <span>Garmin Connect</span>
          </button>
          <button style={styles.trackerButton}>
            <Activity size={18} />
            <span>Coros</span>
          </button>
          <button style={styles.trackerButton}>
            <Activity size={18} />
            <span>Apple Health</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.trackerConnection}>
      <h3 style={styles.sectionTitle}>
        <Activity size={20} />
        Activity Sync
      </h3>
      
      {newActivities.length > 0 && (
        <div style={styles.successMessage}>
          <Activity size={20} />
          <span>Synced {newActivities.length} new run! Your companion is fed!</span>
          {newActivities[0].itemFound && (
            <div style={styles.itemFound}>
              <Sparkles size={16} />
              <span>Found: {newActivities[0].itemFound.name} ({newActivities[0].itemFound.rarity})</span>
            </div>
          )}
        </div>
      )}
      
      {user.provider === 'strava' ? (
        <div style={styles.connectedTracker}>
          <div style={styles.trackerStatus}>
            <div style={styles.connectedBadge}>
              <span style={styles.connectedDot}></span>
              <span>Connected to {getTrackerName()}</span>
            </div>
            {lastSync && (
              <span style={styles.lastSync}>
                Last synced: {new Date(lastSync).toLocaleString()}
              </span>
            )}
          </div>
          
          <button 
            style={isConnecting ? {...styles.syncButton, ...styles.syncButtonDisabled} : styles.syncButton}
            onClick={handleSync}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div style={styles.syncSpinner}></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Activity size={20} />
                <span>Sync Activities</span>
              </>
            )}
          </button>
          
          <p style={styles.syncNote}>
            Activities are automatically pulled from your {getTrackerName()} account. 
            Click sync to check for new runs.
          </p>
        </div>
      ) : (
        getTrackerOptions()
      )}
    </div>
  );
};

const Inventory = ({ items, onApply, appliedItems }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const getRarityColor = (rarity) => {
    switch(rarity) {
      case 'common': return '#74A57F';
      case 'rare': return '#2D6A4F';
      default: return '#74A57F';
    }
  };

  return (
    <div style={styles.inventory}>
      <h3 style={styles.sectionTitle}>
        <Sparkles size={20} />
        Inventory ({items.length} items)
      </h3>
      
      {items.length === 0 ? (
        <p style={styles.emptyState}>
          No items yet. Keep running to find rare Nordic treasures!
        </p>
      ) : (
        <div style={styles.itemGrid}>
          {items.map((item, index) => {
            const isApplied = appliedItems[item.type]?.id === item.id;
            return (
              <div
                key={index}
                style={{
                  ...styles.itemCard,
                  borderColor: getRarityColor(item.rarity),
                  background: isApplied ? getRarityColor(item.rarity) + '15' : '#fff'
                }}
                onClick={() => !isApplied && onApply(item)}
              >
                <div style={styles.itemName}>{item.name}</div>
                <div style={{ ...styles.itemRarity, color: getRarityColor(item.rarity) }}>
                  {item.rarity}
                </div>
                {isApplied && <div style={styles.appliedBadge}>Applied</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const RecentActivities = ({ activities }) => {
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div style={styles.recentActivities}>
      <h3 style={styles.sectionTitle}>Recent Activities</h3>
      
      {activities.length === 0 ? (
        <p style={styles.emptyState}>No activities logged yet. Start running!</p>
      ) : (
        <div style={styles.activityList}>
          {activities.map((activity) => (
            <div key={activity.id} style={styles.activityItem}>
              <div style={styles.activityIcon}>
                <Activity size={16} />
              </div>
              <div style={styles.activityDetails}>
                <div style={styles.activityMain}>
                  <span style={styles.activityDistance}>{activity.distance} km</span>
                  <span style={styles.activityDuration}>{activity.duration} min</span>
                </div>
                <div style={styles.activityDate}>{formatDate(activity.date)}</div>
                {activity.itemFound && (
                  <div style={styles.activityItem}>
                    <Sparkles size={12} />
                    <span style={styles.activityItemName}>{activity.itemFound.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SettingsModal = ({ onClose, character, activities }) => {
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.modalTitle}>Settings & Stats</h2>
        
        <div style={styles.settingsSection}>
          <h3 style={styles.settingsSubtitle}>Character Info</h3>
          <p>Name: {character.name}</p>
          <p>Theme: {character.theme}</p>
          <p>Level: {character.level}</p>
          <p>Health: {character.health}%</p>
          <p>Created: {new Date(character.createdAt).toLocaleDateString()}</p>
        </div>

        <div style={styles.settingsSection}>
          <h3 style={styles.settingsSubtitle}>Running Stats</h3>
          <p>Total Activities: {activities.length}</p>
          <p>Total Distance: {activities.reduce((sum, a) => sum + a.distance, 0).toFixed(1)} km</p>
          <p>Total Time: {Math.floor(activities.reduce((sum, a) => sum + a.duration, 0) / 60)} hours</p>
        </div>

        <div style={styles.settingsSection}>
          <h3 style={styles.settingsSubtitle}>How It Works</h3>
          <p>• Log a run each day to keep your companion healthy</p>
          <p>• Miss 3+ days and your companion starts losing health</p>
          <p>• Find rare items randomly during runs (30% chance)</p>
          <p>• Level up every 5 runs</p>
        </div>

        <button style={styles.closeButton} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// Styles with Nordic/Scandinavian aesthetic
const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #52796F 100%)',
    fontFamily: '"Courier New", monospace',
    padding: '0',
    position: 'relative',
  },
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: 'white',
    marginTop: '20px',
    fontSize: '16px',
  },
  loginScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #52796F 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  loginNorthernLights: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(ellipse at top, rgba(116, 165, 127, 0.3), transparent 50%)',
    animation: 'aurora 8s ease-in-out infinite',
  },
  loginContent: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '60px 50px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    position: 'relative',
    zIndex: 1,
    backdropFilter: 'blur(10px)',
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  loginTitle: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#1B4332',
    margin: '20px 0 10px',
    letterSpacing: '-1px',
  },
  loginSubtitle: {
    fontSize: '16px',
    color: '#7F8C8D',
    lineHeight: '1.6',
    margin: 0,
  },
  loginButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '30px',
  },
  loginButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: '"Courier New", monospace',
  },
  stravaButton: {
    background: '#FC4C02',
    color: 'white',
    boxShadow: '0 4px 15px rgba(252, 76, 2, 0.4)',
  },
  googleButton: {
    background: 'white',
    color: '#3C4043',
    border: '2px solid #DADCE0',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  googleIcon: {
    fontWeight: 'bold',
    fontSize: '18px',
  },
  loginFooter: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#95A5A6',
    margin: 0,
  },
  header: {
    background: 'rgba(255, 255, 255, 0.95)',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #1B4332',
    backdropFilter: 'blur(10px)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  headerTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1B4332',
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  userName: {
    fontSize: '14px',
    color: '#52796F',
    fontWeight: '600',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#1B4332',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s ease',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
    display: 'grid',
    gap: '30px',
  },
  tamagotchiScreen: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  screenBorder: {
    background: 'linear-gradient(145deg, #2D6A4F, #1B4332)',
    padding: '25px',
    borderRadius: '30px',
    boxShadow: '0 15px 40px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.2)',
  },
  screenInner: {
    background: '#C7D5CC',
    padding: '30px',
    borderRadius: '20px',
    border: '4px solid #1B4332',
    minWidth: '400px',
    boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.2)',
  },
  screenHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #1B4332',
  },
  screenCharacterName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1B4332',
  },
  screenLevel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#52796F',
    background: '#E8F0EC',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  creatureDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '250px',
    marginBottom: '20px',
  },
  pixelCreature: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  creatureRow: {
    display: 'flex',
    gap: '3px',
  },
  creaturePixel: {
    width: '22px',
    height: '22px',
    borderRadius: '3px',
  },
  emptyPixel: {
    width: '22px',
    height: '22px',
  },
  statusIcons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '15px',
  },
  statusIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#E8F0EC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #1B4332',
  },
  screenHealthBar: {
    marginBottom: '15px',
  },
  screenHealthLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: '6px',
    textAlign: 'center',
  },
  screenHealthBarBg: {
    width: '100%',
    height: '16px',
    background: '#A8BBAE',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #1B4332',
    marginBottom: '5px',
  },
  screenHealthBarFill: {
    height: '100%',
    transition: 'width 0.5s ease, background 0.5s ease',
  },
  screenHealthValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1B4332',
    textAlign: 'center',
  },
  screenWarning: {
    background: '#F4A259',
    color: '#1B4332',
    padding: '10px',
    borderRadius: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '14px',
    border: '2px solid #1B4332',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  statsPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  statIcon: {
    width: '50px',
    height: '50px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1B4332',
  },
  statLabel: {
    fontSize: '14px',
    color: '#52796F',
    marginTop: '4px',
  },
  trackerConnection: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  connectedTracker: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  trackerStatus: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  connectedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1B4332',
  },
  connectedDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#40916C',
    display: 'inline-block',
    animation: 'pulse 2s ease-in-out infinite',
  },
  lastSync: {
    fontSize: '14px',
    color: '#52796F',
  },
  syncButton: {
    background: '#40916C',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'background 0.3s ease, transform 0.2s ease',
    fontFamily: '"Courier New", monospace',
  },
  syncButtonDisabled: {
    background: '#74A57F',
    cursor: 'not-allowed',
  },
  syncSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255,255,255,0.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  syncNote: {
    fontSize: '14px',
    color: '#52796F',
    lineHeight: '1.5',
  },
  trackerOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  trackerPrompt: {
    fontSize: '16px',
    color: '#1B4332',
    fontWeight: '600',
  },
  trackerButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
  },
  trackerButton: {
    background: 'white',
    border: '2px solid #2D6A4F',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1B4332',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.3s ease',
    fontFamily: '"Courier New", monospace',
  },
  successMessage: {
    background: '#D8F3DC',
    border: '2px solid #95D5B2',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#1B4332',
    fontWeight: '600',
    flexWrap: 'wrap',
  },
  itemFound: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginLeft: 'auto',
    background: '#F4E5C2',
    padding: '6px 12px',
    borderRadius: '8px',
    color: '#6B5A3D',
  },
  activityForm: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto',
    gap: '15px',
    alignItems: 'end',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2C3E50',
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #E0E0E0',
    borderRadius: '10px',
    fontSize: '16px',
    fontFamily: '"Courier New", monospace',
    transition: 'border-color 0.3s ease',
  },
  submitButton: {
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background 0.3s ease, transform 0.2s ease',
    fontFamily: '"Courier New", monospace',
  },
  inventory: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '15px',
  },
  itemCard: {
    background: 'white',
    border: '3px solid',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    textAlign: 'center',
    position: 'relative',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1B4332',
    marginBottom: '6px',
  },
  itemRarity: {
    fontSize: '12px',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  appliedBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: '#40916C',
    color: 'white',
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '700',
  },
  recentActivities: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    background: '#F5F5F5',
    borderRadius: '10px',
    border: '2px solid #E0E0E0',
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#40916C',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  activityMain: {
    display: 'flex',
    gap: '16px',
    marginBottom: '4px',
  },
  activityDistance: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1B4332',
  },
  activityDuration: {
    fontSize: '16px',
    color: '#52796F',
  },
  activityDate: {
    fontSize: '12px',
    color: '#74A57F',
  },
  activityItemName: {
    fontSize: '12px',
    color: '#6B5A3D',
  },
  emptyState: {
    textAlign: 'center',
    color: '#74A57F',
    padding: '40px 20px',
    fontSize: '16px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1B4332',
    marginBottom: '30px',
  },
  settingsSection: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #E0E0E0',
  },
  settingsSubtitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: '12px',
  },
  closeButton: {
    width: '100%',
    background: '#2D6A4F',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    fontFamily: '"Courier New", monospace',
  },
};

// Add CSS animation for loading spinner and aurora effect
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes aurora {
    0%, 100% { opacity: 0.6; transform: translateY(0) scaleX(1); }
    50% { opacity: 0.9; transform: translateY(-20px) scaleX(1.1); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  
  button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.2) !important;
  }
  
  .trackerButton:hover {
    background: #E8F0EC !important;
    border-color: #1B4332 !important;
  }
  
  input:focus {
    outline: none;
    border-color: #2D6A4F !important;
  }
  
  @media (max-width: 768px) {
    .activityForm {
      grid-template-columns: 1fr !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default RunningCompanion;
