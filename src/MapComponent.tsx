import React, { useRef, useState, useEffect } from 'react';

// 타입 정의
interface Emergency {
  id: string;
  type: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: string;
  priority: string;
  time: string;
  description: string;
}

interface Vehicle {
  id: string;
  type: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: string;
  assignedTo?: string;
}

interface MapComponentProps {
  emergencies: Emergency[];
  vehicles: Vehicle[];
}

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        Map: any;
        LatLng: any;
        Marker: any;
        ZoomControl: any;
        ControlPosition: any;
        CustomOverlay: any;
        InfoWindow: any;
        event: {
          addListener: (target: any, type: string, handler: () => void) => void;
        };
      };
    };
  }
}

const MapComponent: React.FC<MapComponentProps> = ({ emergencies, vehicles }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const isInitialized = useRef(false);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 마커와 오버레이 정리 함수
  const clearMarkersAndOverlays = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];
  };

  // 긴급상황 마커 생성
  const createEmergencyMarkers = (map: any, emergencies: Emergency[]) => {
    emergencies.forEach(emergency => {
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(emergency.coordinates.lat, emergency.coordinates.lng),
        title: emergency.description
      });
      marker.setMap(map);
      markersRef.current.push(marker);

      // 긴급상황 타입에 따른 아이콘과 색상
      let icon = '🚨';
      let color = '#ef4444';
      switch (emergency.type) {
        case '화재':
          icon = '🔥';
          color = '#dc2626';
          break;
        case '교통사고':
          icon = '🚗';
          color = '#f59e0b';
          break;
        case '의료응급':
          icon = '🏥';
          color = '#dc2626';
          break;
        case '범죄':
          icon = '👮‍♂️';
          color = '#7c3aed';
          break;
        case '자연재해':
          icon = '🌪️';
          color = '#059669';
          break;
        default:
          icon = '🚨';
          color = '#ef4444';
      }

      // 커스텀 오버레이 생성
      const overlayContent = `
        <div style="
          padding: 8px 12px;
          background: ${emergency.priority === '긴급' ? '#dc2626' : emergency.priority === '높음' ? '#f59e0b' : '#6b7280'};
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          white-space: nowrap;
          cursor: pointer;
          border: 2px solid white;
        ">
          ${icon} ${emergency.type}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        content: overlayContent,
        position: new window.kakao.maps.LatLng(emergency.coordinates.lat, emergency.coordinates.lng),
        yAnchor: 2
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);

      // 정보창 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 200px;">
            <h4 style="margin: 0 0 5px 0; color: ${color};">${icon} ${emergency.type}</h4>
            <p style="margin: 0; font-size: 12px;"><strong>위치:</strong> ${emergency.location}</p>
            <p style="margin: 0; font-size: 12px;"><strong>상태:</strong> ${emergency.status}</p>
            <p style="margin: 0; font-size: 12px;"><strong>우선순위:</strong> ${emergency.priority}</p>
            <p style="margin: 0; font-size: 12px;"><strong>시간:</strong> ${emergency.time}</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">${emergency.description}</p>
          </div>
        `
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  // 긴급차량 마커 생성
  const createVehicleMarkers = (map: any, vehicles: Vehicle[]) => {
    vehicles.forEach(vehicle => {
      // 마커 생성
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(vehicle.coordinates.lat, vehicle.coordinates.lng),
        title: `${vehicle.type} - ${vehicle.status}`
      });
      marker.setMap(map);
      markersRef.current.push(marker);

      // 차량 타입에 따른 아이콘과 색상
      let icon = '🚐';
      let color = '#3b82f6';
      switch (vehicle.type) {
        case '소방차':
          icon = '🚒';
          color = '#dc2626';
          break;
        case '구급차':
          icon = '🚑';
          color = '#059669';
          break;
        case '경찰차':
          icon = '🚔';
          color = '#1d4ed8';
          break;
        case '레스큐':
          icon = '🚐';
          color = '#f59e0b';
          break;
        default:
          icon = '🚐';
          color = '#3b82f6';
      }

      // 상태에 따른 배경색
      const statusColor = vehicle.status === '출동중' ? '#dc2626' : 
                         vehicle.status === '현장도착' ? '#f59e0b' : 
                         vehicle.status === '대기중' ? '#6b7280' : '#059669';

      // 커스텀 오버레이 생성
      const overlayContent = `
        <div style="
          padding: 6px 10px;
          background: ${statusColor};
          color: white;
          border-radius: 15px;
          font-size: 11px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid white;
        ">
          ${icon} ${vehicle.type}
        </div>
      `;

      const overlay = new window.kakao.maps.CustomOverlay({
        content: overlayContent,
        position: new window.kakao.maps.LatLng(vehicle.coordinates.lat, vehicle.coordinates.lng),
        yAnchor: 2
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);

      // 정보창 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; min-width: 180px;">
            <h4 style="margin: 0 0 5px 0; color: ${color};">${icon} ${vehicle.type}</h4>
            <p style="margin: 0; font-size: 12px;"><strong>위치:</strong> ${vehicle.location}</p>
            <p style="margin: 0; font-size: 12px;"><strong>상태:</strong> ${vehicle.status}</p>
            ${vehicle.assignedTo ? `<p style="margin: 0; font-size: 12px;"><strong>할당:</strong> ${vehicle.assignedTo}</p>` : ''}
          </div>
        `
      });

      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  // 맵 초기화
  useEffect(() => {
    if (isInitialized.current || mapInstance.current) {
      console.log('이미 초기화됨, 스킵');
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          // 울산시청 좌표
          resolve({ lat: 35.5384, lng: 129.3114 });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // 위치 정보 실패시 울산시청 좌표 사용
            resolve({ lat: 35.5384, lng: 129.3114 });
          },
          { timeout: 5000 }
        );
      });
    };

    const initializeMap = async (): Promise<void> => {
      if (!isMounted || isInitialized.current) return;

      if (!mapRef.current || !window.kakao?.maps) {
        setTimeout(initializeMap, 100);
        return;
      }

      console.log('맵 초기화 시작 (한 번만)');
      isInitialized.current = true;

      try {
        const currentLocation = await getCurrentLocation();
        
        window.kakao.maps.load(() => {
          if (!isMounted || !mapRef.current) return;

          const options = {
            center: new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
            level: 5
          };

          const map = new window.kakao.maps.Map(mapRef.current, options);
          mapInstance.current = map;

          // 현재 위치 마커
          const currentMarker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
            title: '현재 위치'
          });
          currentMarker.setMap(map);
          markersRef.current.push(currentMarker);

          // 줌 컨트롤
          const zoomControl = new window.kakao.maps.ZoomControl();
          map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

          // 긴급상황 및 차량 마커 생성
          createEmergencyMarkers(map, emergencies);
          createVehicleMarkers(map, vehicles);

          console.log('맵 초기화 완료');
          if (isMounted) {
            setIsLoading(false);
          }
        });
      } catch (err) {
        console.error('맵 초기화 오류:', err);
        if (isMounted) {
          setError(`맵 로딩 실패: ${err}`);
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(initializeMap, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // 긴급상황이나 차량 정보가 변경될 때 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current) return;

    console.log('마커 업데이트:', emergencies.length, vehicles.length);
    
    // 기존 마커들 정리 (현재 위치 마커 제외)
    const currentLocationMarker = markersRef.current[0]; // 첫 번째는 현재 위치 마커
    clearMarkersAndOverlays();
    
    // 현재 위치 마커 다시 추가
    if (currentLocationMarker) {
      markersRef.current.push(currentLocationMarker);
    }

    // 새로운 마커들 생성
    createEmergencyMarkers(mapInstance.current, emergencies);
    createVehicleMarkers(mapInstance.current, vehicles);
  }, [emergencies, vehicles]);

  if (error) {
    return (
      <div className="map-container">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#ef4444'
        }}>
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {isLoading && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'rgba(249, 250, 251, 0.95)',
          zIndex: 10
        }}>
          📍 지도 로딩 중...
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '0.375rem'
        }} 
      />
    </div>
  );
};

export default MapComponent;