import React, { useState, useEffect, useRef } from 'react';
import './EmergencyControlSystem.css';
import MapComponent from './MapComponent';

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

interface EmergencyVehicle {
  id: string;
  type: string;
  location: string;
  status: '출동중' | '대기중';
  eta: string;
}

interface Incident {
  id: string;
  type: string;
  location: string;
  severity: '심각' | '중간' | '낮음';
  reportTime: string;
}

interface IllegalParking {
  id: string;
  vehicleNo: string;
  location: string;
  time: string;
  status: '단속중' | '확인필요' | '조치완료';
}

interface CameraFeed {
  id: number;
  name: string;
  status: '감시중' | '발견됨';
  ip: string;
}

interface ModalStreamProps {
  cameraId: number | null;
  cameraList: CameraFeed[];
}

const EmergencyControlSystem: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');
  const [selectedCamera, setSelectedCamera] = useState<number>(1);
  const [cameraLayout, setCameraLayout] = useState<string>("2x2");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("모든 유형");
  const [modalCamera, setModalCamera] = useState<number | null>(null);
  const [selectedParking, setSelectedParking] = useState<string | null>(null);

  // 현재 시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedTime = now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      setCurrentTime(formattedTime);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // 긴급상황 데이터 (울산 지역)
  const [emergencies] = useState<Emergency[]>([
    {
      id: 'E001',
      type: '화재',
      location: '울산시 남구 삼산로 350',
      coordinates: { lat: 35.5384, lng: 129.3114 },
      status: '대응중',
      priority: '긴급',
      time: '2024-03-15 14:30',
      description: '상가건물 3층에서 화재 발생'
    },
    {
      id: 'E002',
      type: '교통사고',
      location: '울산시 중구 성남동 중앙로',
      coordinates: { lat: 35.5595, lng: 129.3242 },
      status: '접수',
      priority: '높음',
      time: '2024-03-15 14:45',
      description: '2중 추돌사고, 부상자 2명'
    },
    {
      id: 'E003',
      type: '의료응급',
      location: '울산시 북구 화봉동 울산대학교',
      coordinates: { lat: 35.5449, lng: 129.2677 },
      status: '처리완료',
      priority: '긴급',
      time: '2024-03-15 13:20',
      description: '심장마비 환자 발생'
    },
    {
      id: 'E004',
      type: '범죄',
      location: '울산시 동구 일산동 현대백화점',
      coordinates: { lat: 35.5102, lng: 129.4161 },
      status: '대응중',
      priority: '높음',
      time: '2024-03-15 14:50',
      description: '편의점 강도사건 신고'
    }
  ]);

  // 긴급차량 데이터 (울산 지역)
  const [vehicles] = useState<Vehicle[]>([
    {
      id: 'V001',
      type: '소방차',
      location: '울산시 남구 삼산로 근처',
      coordinates: { lat: 35.5380, lng: 129.3120 },
      status: '출동중',
      assignedTo: 'E001'
    },
    {
      id: 'V002',
      type: '구급차',
      location: '울산시 중구 성남동 중앙로 근처',
      coordinates: { lat: 35.5590, lng: 129.3250 },
      status: '현장도착',
      assignedTo: 'E002'
    },
    {
      id: 'V003',
      type: '경찰차',
      location: '울산시 동구 일산동 현대백화점 근처',
      coordinates: { lat: 35.5100, lng: 129.4165 },
      status: '출동중',
      assignedTo: 'E004'
    },
    {
      id: 'V004',
      type: '소방차',
      location: '울산시 중구 태화동 소방서',
      coordinates: { lat: 35.5668, lng: 129.3133 },
      status: '대기중'
    },
    {
      id: 'V005',
      type: '구급차',
      location: '울산시 동구 전하동 울산대학교병원',
      coordinates: { lat: 35.5439, lng: 129.3589 },
      status: '복귀중'
    }
  ]);

  // 기존 데이터와 호환되는 형태로 변환
  const emergencyVehicles: EmergencyVehicle[] = vehicles.map(vehicle => ({
    id: vehicle.id,
    type: vehicle.type,
    location: vehicle.location,
    status: vehicle.status === '출동중' || vehicle.status === '현장도착' ? '출동중' : '대기중',
    eta: vehicle.status === '출동중' ? '5분' : vehicle.status === '현장도착' ? '도착완료' : '-'
  }));

  const incidents: Incident[] = emergencies.map(emergency => ({
    id: emergency.id,
    type: emergency.type,
    location: emergency.location,
    severity: emergency.priority === '긴급' ? '심각' : emergency.priority === '높음' ? '중간' : '낮음',
    reportTime: emergency.time.split(' ')[1]
  }));

  // 불법주차 데이터 (울산 지역)
  const illegalParking: IllegalParking[] = [
    { id: 'P001', vehicleNo: '울산 가 1234', location: '울산시 남구 삼산로 350 앞', time: '08:15:24', status: '단속중' },
    { id: 'P002', vehicleNo: '울산 나 5678', location: '울산시 중구 성남동 중앙로 앞', time: '08:30:12', status: '확인필요' },
    { id: 'P003', vehicleNo: '울산 다 9012', location: '울산시 동구 일산동 현대백화점 앞', time: '08:45:36', status: '조치완료' },
    { id: 'P004', vehicleNo: '울산 라 3456', location: '울산시 북구 화봉동 울산대학교 앞', time: '09:10:15', status: '단속중' }
  ];

  // CCTV 카메라 데이터 (울산 지역)
  const cameraFeedList: CameraFeed[] = [
    { id: 1, name: '삼산로 교차로', status: '감시중', ip: '172.31.0.101' },
    { id: 2, name: '성남동 중앙로', status: '발견됨', ip: '172.31.0.102' },
    { id: 3, name: '화봉동 울산대학교', status: '감시중', ip: '172.31.0.103' },
    { id: 4, name: '일산동 현대백화점', status: '감시중', ip: '172.31.0.104' },
    { id: 5, name: '태화동 소방서', status: '발견됨', ip: '172.31.0.105' },
    { id: 6, name: '전하동 병원', status: '감시중', ip: '172.31.0.106' }
  ];

  // 필터링 함수
  const filterVehicles = (vehicles: EmergencyVehicle[]) => {
    if (filterValue === "모든 유형") {
      return vehicles.filter(v =>
        v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return vehicles.filter(v =>
        v.type === filterValue &&
        (v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  };

  const filterIllegalParking = (parkings: IllegalParking[]) => {
    if (filterValue === "모든 상태") {
      return parkings.filter(p =>
        p.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      return parkings.filter(p =>
        p.status === filterValue &&
        (p.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
  };

  const filterCameras = (cameras: CameraFeed[]) => {
    return cameras.filter(camera =>
      camera.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // 모달 내부 스트림 컴포넌트
  const ModalStreamComponent: React.FC<ModalStreamProps> = ({ cameraId, cameraList }) => {
    const videoRef = useRef<HTMLImageElement>(null);

    // 초기 이미지 URL 설정
    const camera = cameraList.find(cam => cam.id === cameraId);
    const ip = camera?.ip || '172.31.0.101';

    useEffect(() => {
      if (cameraId !== null && videoRef.current) {
        // 기존 그리드의 이미지 엘리먼트를 찾아서 src를 복사
        const gridImage = document.querySelector(`.camera-feed[data-camera-id="${cameraId}"] img`) as HTMLImageElement;
        
        if (gridImage && gridImage.src) {
          // 그리드 이미지의 현재 src를 그대로 사용
          videoRef.current.src = gridImage.src;
          
          // 그리드 이미지를 일시적으로 숨김
          gridImage.style.visibility = 'hidden';
        } else {
          // 그리드 이미지가 없는 경우에만 새로운 스트림 연결
          const streamUrl = `http://${ip}:81/stream?t=${Date.now()}`;
          videoRef.current.src = streamUrl;
        }
      }

      // 정리 함수: 모달이 닫힐 때 그리드 이미지 다시 표시
      return () => {
        if (cameraId !== null) {
          const gridImage = document.querySelector(`.camera-feed[data-camera-id="${cameraId}"] img`) as HTMLImageElement;
          if (gridImage) {
            gridImage.style.visibility = 'visible';
          }
        }
      };
    }, [cameraId, cameraList, ip]);

    if (!cameraId) return null;

    return (
      <div className="modal-camera-feed">
        <div className="modal-camera-image">
          <img
            ref={videoRef}
            alt={`카메라 ${cameraId}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = 'https://placehold.co/800x450/1f2937/cccccc?text=연결+실패';
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    );
  };

  // 대시보드 - 긴급 상황 카드
  const renderIncidentCard = (incident: Incident) => (
    <div key={incident.id} className="incident-card">
      <div className="incident-card-header">
        <div className="incident-card-title">
          <span className="incident-icon">⚠️</span>
          {incident.type} #{incident.id}
        </div>
        <div className={`incident-severity ${incident.severity === '심각' ? 'high' : 'medium'}`}>
          {incident.severity}
        </div>
      </div>
      <div className="incident-details">
        <div className="incident-detail">
          <span className="detail-icon">📍</span>
          <span>{incident.location}</span>
        </div>
        <div className="incident-detail">
          <span className="detail-icon">🕒</span>
          <span>신고시간: {incident.reportTime}</span>
        </div>
      </div>
    </div>
  );

  // 대시보드 - 긴급차량 카드
  const renderVehicleCard = (vehicle: EmergencyVehicle) => (
    <div key={vehicle.id} className="vehicle-card">
      <div className="vehicle-card-header">
        <div className="vehicle-card-title">
          <span className="vehicle-icon">
            {vehicle.type === '소방차' ? '🚒' : vehicle.type === '구급차' ? '🚑' : '🚓'}
          </span>
          {vehicle.type} {vehicle.id}
        </div>
        <div className={`vehicle-status ${vehicle.status === '출동중' ? 'active' : 'standby'}`}>
          {vehicle.status}
        </div>
      </div>
      <div className="vehicle-details">
        <div className="vehicle-detail">
          <span className="detail-icon">📍</span>
          <span>{vehicle.location}</span>
        </div>
        {vehicle.eta !== '-' && (
          <div className="vehicle-detail">
            <span className="detail-icon">🕒</span>
            <span>도착예정: {vehicle.eta}</span>
          </div>
        )}
      </div>
    </div>
  );

// 카메라 피드 렌더링
const renderCameraFeed = (id: number) => {
  const camera = cameraFeedList.find(cam => cam.id === id);
  const status = camera?.status || '감시중';
  const ip = camera?.ip || '172.31.0.101';
  const streamUrl = `http://${ip}:81/stream`;

  return (
    <div
      key={id}
      className={`camera-feed ${id === selectedCamera ? 'active' : ''}`}
      data-camera-id={id} // 모달에서 참조할 수 있도록 data 속성 추가
      onClick={() => {
        setModalCamera(id);
      }}
    >
      <div className="camera-feed-label">
        카메라 {id}
      </div>
      <div className="camera-feed-status">
        {status}
      </div>
      {status === '발견됨' && (
        <div className="camera-feed-recording">
          <div className="recording-indicator"></div>
          <span className="recording-label">주차발견</span>
        </div>
      )}
      <div className="camera-feed-image">
        <img
          src={streamUrl}
          alt={`카메라 ${id}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://placehold.co/400x225/1f2937/cccccc?text=Connection+failed';
          }}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            visibility: 'visible' // 초기값 설정
          }}
        />
      </div>
      <div className="camera-feed-name">
        {camera?.name || `카메라 ${id}`}
      </div>
    </div>
  );
};

  return (
    <div className="app-container">
      {/* 헤더 */}
      <div className="header">
        <div className="header-title">
          <span>🚒</span>
          <h1>긴급차량 접근 불법주차 관리 시스템</h1>
        </div>
        <div className="header-info">
          <span>운영자: 관리자</span>
          <span>{currentTime}</span>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        {/* 사이드바 내비게이션 */}
        <div className="sidebar">
          <div
            className={`tab ${selectedTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setSelectedTab('dashboard')}
          >
            <span>ℹ️</span>
            <span className="tab-label">대시보드</span>
          </div>
          <div
            className={`tab ${selectedTab === 'map' ? 'active' : ''}`}
            onClick={() => setSelectedTab('map')}
          >
            <span>📍</span>
            <span className="tab-label">맵 모니터링</span>
          </div>
          <div
            className={`tab ${selectedTab === 'camera' ? 'active' : ''}`}
            onClick={() => setSelectedTab('camera')}
          >
            <span>📹</span>
            <span className="tab-label">불법주차 감시</span>
          </div>
          <div
            className={`tab ${selectedTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setSelectedTab('vehicles')}
          >
            <span>🚒</span>
            <span className="tab-label">긴급차량 관리</span>
          </div>
          <div
            className={`tab ${selectedTab === 'parking' ? 'active' : ''}`}
            onClick={() => setSelectedTab('parking')}
          >
            <span>🚗</span>
            <span className="tab-label">불법주차 관리</span>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="content-area">
          {selectedTab === 'dashboard' && (
            <div>
              <h2 className="dashboard-title">통합 관제 대시보드</h2>
              <div className="dashboard-grid">
                <div className="dashboard-main">
                  <div className="card">
                    <h3 className="card-title">실시간 상황도</h3>
                    <MapComponent 
                      emergencies={emergencies} 
                      vehicles={vehicles} 
                      />
                  </div>
                </div>
                <div>
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">긴급상황 정보</h3>
                      <span className="card-count">{incidents.length}건의 긴급상황</span>
                    </div>
                    {incidents.map(incident => renderIncidentCard(incident))}
                  </div>
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">출동 중인 긴급차량</h3>
                      <span className="card-count">
                        {emergencyVehicles.filter(v => v.status === '출동중').length}대 출동중
                      </span>
                    </div>
                    {emergencyVehicles
                      .filter(v => v.status === '출동중')
                      .map(vehicle => renderVehicleCard(vehicle))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'map' && (
            <div>
              <h2 className="dashboard-title">맵 모니터링</h2>
              <div className="search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="위치 검색"
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <select
                  className="filter-select"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option>모든 유형</option>
                  <option>긴급차량</option>
                  <option>사고지점</option>
                  <option>불법주차</option>
                </select>
              </div>
              <div className="card" style={{ height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
                <MapComponent 
                  emergencies={emergencies} 
                  vehicles={vehicles} 
                />
              </div>
            </div>
          )}

          {selectedTab === 'camera' && (
            <div>
              <h2 className="dashboard-title">CCTV 불법주차 감시</h2>
              <div className="camera-layout">
                <div className="camera-sidebar">
                  <h3 className="card-title">CCTV 불법주차 감시</h3>
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="카메라 검색"
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                  </div>
                  <div className="camera-list">
                    {filterCameras(cameraFeedList).map(camera => (
                      <div
                        key={camera.id}
                        className={`camera-list-item ${selectedCamera === camera.id ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCamera(camera.id)
                          if (cameraLayout === "1x1") {
                            setModalCamera(camera.id)
                          }
                        }}
                      >
                        <div className="camera-list-content">
                          <div className="camera-name">
                            <span className="camera-name-icon">📹</span>
                            <span>{camera.name}</span>
                          </div>
                          <div className="camera-status">
                            <div className={`status-indicator ${camera.status === '감시중' ? 'monitoring' : 'detected'}`}></div>
                            <span>{camera.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="camera-grid-container">
                  <div className="camera-grid-card">
                    <div className="camera-grid-header">
                      <h3 className="card-title">불법주차 감시 화면</h3>
                      <select
                        className="layout-select"
                        value={cameraLayout}
                        onChange={(e) => setCameraLayout(e.target.value)}
                      >
                        <option value="1x1">1 x 1</option>
                        <option value="2x2">2 x 2</option>
                        <option value="3x3">3 x 3</option>
                      </select>
                    </div>
                    <div className="camera-grid" style={{
                      gridTemplateColumns: cameraLayout === "1x1" ? "1fr" :
                        cameraLayout === "2x2" ? "1fr 1fr" :
                          "1fr 1fr 1fr"
                    }}>
                      {cameraLayout === "1x1" ?
                        // 1x1 레이아웃: 선택한 카메라만 표시
                        [selectedCamera].map(id => renderCameraFeed(id)) :
                        cameraLayout === "2x2" ?
                          // 2x2 레이아웃: 선택한 카메라를 첫 번째로 하고 나머지 채움
                          [
                            selectedCamera,
                            ...cameraFeedList
                              .filter(cam => cam.id !== selectedCamera)
                              .slice(0, 3)
                              .map(cam => cam.id)
                          ].map(id => renderCameraFeed(id)) :
                          // 3x3 레이아웃: 선택한 카메라를 첫 번째로 하고 나머지 채움
                          [
                            selectedCamera,
                            ...cameraFeedList
                              .filter(cam => cam.id !== selectedCamera)
                              .slice(0, 8)
                              .map(cam => cam.id)
                          ].map(id => renderCameraFeed(id))
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'vehicles' && (
            <div>
              <h2 className="dashboard-title">긴급차량 관리</h2>
              <div className="search-container">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="차량 ID 또는 위치 검색"
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
                <select
                  className="filter-select"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                >
                  <option>모든 유형</option>
                  <option>소방차</option>
                  <option>구급차</option>
                  <option>순찰차</option>
                </select>
              </div>
              <div className="vehicle-grid">
                {filterVehicles(emergencyVehicles).map(vehicle => renderVehicleCard(vehicle))}
              </div>
            </div>
          )}

          {selectedTab === 'parking' && (
            <div>
              <h2 className="dashboard-title">불법주차 관리</h2>
              <div className="search-container">
                <div className="search-filter-area">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="차량번호 또는 위치 검색"
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <span className="search-icon">🔍</span>
                  </div>
                  <select
                    className="filter-select"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option>모든 상태</option>
                    <option>단속중</option>
                    <option>확인필요</option>
                    <option>조치완료</option>
                  </select>
                </div>
                <div className="stat-badges">
                  <div className="stat-badge enforcing">
                    <span className="stat-count">{illegalParking.filter(p => p.status === '단속중').length}</span>
                    <span className="stat-label">단속중</span>
                  </div>
                  <div className="stat-badge pending">
                    <span className="stat-count">{illegalParking.filter(p => p.status === '확인필요').length}</span>
                    <span className="stat-label">확인필요</span>
                  </div>
                  <div className="stat-badge completed">
                    <span className="stat-count">{illegalParking.filter(p => p.status === '조치완료').length}</span>
                    <span className="stat-label">조치완료</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="parking-table-container">
                  <table className="parking-table">
                    <thead>
                      <tr className="table-header">
                        <th>ID</th>
                        <th>차량번호</th>
                        <th>위치</th>
                        <th>발견시간</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterIllegalParking(illegalParking).map(violation => (
                        <tr
                          key={violation.id}
                          className={`table-row ${selectedParking === violation.id ? 'selected' : ''}`}
                          onClick={() => setSelectedParking(violation.id)}
                        >
                          <td className="table-cell">{violation.id}</td>
                          <td className="table-cell vehicle-no">{violation.vehicleNo}</td>
                          <td className="table-cell">{violation.location}</td>
                          <td className="table-cell">{violation.time}</td>
                          <td className="table-cell">
                            <span className={`status-badge ${violation.status === '단속중' ? 'enforcing' :
                              violation.status === '조치완료' ? 'completed' :
                                'pending'
                              }`}>
                              {violation.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedParking && (
                  <div className="parking-action-panel">
                    <h3 className="action-panel-title">불법주차 조치</h3>
                    <div className="parking-details">
                      <div className="detail-item">
                        <span className="detail-label">차량번호:</span>
                        <span className="detail-value">{illegalParking.find(p => p.id === selectedParking)?.vehicleNo}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">위치:</span>
                        <span className="detail-value">{illegalParking.find(p => p.id === selectedParking)?.location}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">발견시간:</span>
                        <span className="detail-value">{illegalParking.find(p => p.id === selectedParking)?.time}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">상태:</span>
                        <span className={`detail-value status-${illegalParking.find(p => p.id === selectedParking)?.status === '단속중' ? 'enforcing' :
                          illegalParking.find(p => p.id === selectedParking)?.status === '조치완료' ? 'completed' :
                            'pending'}`}>
                          {illegalParking.find(p => p.id === selectedParking)?.status}
                        </span>
                      </div>
                    </div>
                    <div className="action-buttons">
                      <button className="action-button warning">불법주차 차량 이동 요청</button>
                      <button className="action-button dispatch">긴급차량 연락</button>
                      <button className="action-button complete">조치 완료 처리</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 카메라 모달 */}
      {modalCamera && (
        <div className="camera-modal-overlay" onClick={() => setModalCamera(null)}>
          <div className="camera-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={() => setModalCamera(null)}>
              ✕
            </button>
            <h3>{cameraFeedList.find(cam => cam.id === modalCamera)?.name || `카메라 ${modalCamera}`}</h3>
            <ModalStreamComponent
              cameraId={modalCamera}
              cameraList={cameraFeedList}
            />
            {/* 추가 카메라 정보 및 조치 버튼 */}
            <div className="modal-camera-info">
              <div className="modal-camera-status">
                상태: <span className={cameraFeedList.find(cam => cam.id === modalCamera)?.status === '발견됨' ? 'status-detected' : 'status-normal'}>
                  {cameraFeedList.find(cam => cam.id === modalCamera)?.status || '감시중'}
                </span>
              </div>
              <div className="modal-camera-ip">
                IP: {cameraFeedList.find(cam => cam.id === modalCamera)?.ip || '172.31.0.101'}
              </div>
              {cameraFeedList.find(cam => cam.id === modalCamera)?.status === '발견됨' && (
                <div className="modal-actions">
                  <button className="action-button warning">불법주차 차량 이동 요청</button>
                  <button className="action-button dispatch">긴급차량 연락</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyControlSystem;