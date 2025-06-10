import React, { useState, useEffect, useRef } from 'react';
import './EmergencyControlSystem.css';

// 타입 정의
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
  streamKey: number;
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
  const [isStreamPaused, setIsStreamPaused] = useState<boolean>(false);
  const [streamKey, setStreamKey] = useState<number>(0); // 스트림 새로고침 키

  // 모달 열기/닫기에 따른 스트림 관리
  useEffect(() => {
    if (modalCamera !== null) {
      // 모달이 열리면 그리드 스트림 중지
      setIsStreamPaused(true);

      // 모달 스트림 연결을 위한 고유 키 증가
      setStreamKey(prev => prev + 1);
    } else {
      // 모달이 닫히면 약간의 지연 후 그리드 스트림 다시 시작
      const timer = setTimeout(() => {
        setIsStreamPaused(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [modalCamera]);

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

  // 샘플 데이터 - 실제 구현에서는 API로 가져올 데이터
  const emergencyVehicles: EmergencyVehicle[] = [
    { id: 'E001', type: '소방차', location: '강남구 테헤란로 123', status: '출동중', eta: '5분' },
    { id: 'E002', type: '구급차', location: '서초구 서초대로 456', status: '대기중', eta: '-' },
    { id: 'E003', type: '순찰차', location: '강남구 학동로 789', status: '출동중', eta: '3분' }
  ];

  const incidents: Incident[] = [
    { id: 'I001', type: '화재', location: '강남구 역삼동 123-45', severity: '심각', reportTime: '09:15:24' },
    { id: 'I002', type: '교통사고', location: '서초구 서초동 456-78', severity: '중간', reportTime: '08:36:47' }
  ];

  const illegalParking: IllegalParking[] = [
    { id: 'P001', vehicleNo: '서울 가 1234', location: '강남구 역삼동 123-45 앞', time: '08:15:24', status: '단속중' },
    { id: 'P002', vehicleNo: '경기 나 5678', location: '서초구 서초동 456-78 앞', time: '08:30:12', status: '확인필요' },
    { id: 'P003', vehicleNo: '서울 다 9012', location: '강남구 삼성동 901-23 앞', time: '08:45:36', status: '조치완료' }
  ];

  const cameraFeedList: CameraFeed[] = [
    { id: 1, name: '역삼동 교차로', status: '감시중', ip: '172.31.0.101' },
    { id: 2, name: '서초동 대로', status: '발견됨', ip: '172.31.0.102' },
    { id: 3, name: '삼성동 주택가', status: '감시중', ip: '172.31.0.103' },
    { id: 4, name: '강남대로 입구', status: '감시중', ip: '172.31.0.104' },
    { id: 5, name: '테헤란로 사거리', status: '발견됨', ip: '172.31.0.105' },
    { id: 6, name: '학동로 골목', status: '감시중', ip: '172.31.0.106' }
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
  const ModalStreamComponent: React.FC<ModalStreamProps> = ({ cameraId, streamKey, cameraList }) => {
    const videoRef = useRef<HTMLImageElement>(null);

    // 초기 이미지 URL 설정
    const camera = cameraList.find(cam => cam.id === cameraId);
    const ip = camera?.ip || '172.31.0.101';
    const initialStreamUrl = `http://${ip}:81/stream?init=true`;

    useEffect(() => {
      if (cameraId !== null && videoRef.current) {

        // 약간의 지연 후 스트림 연결 (이전 연결이 완전히 끊기도록)
        const timer = setTimeout(() => {
          if (videoRef.current) {
            // 새로운 스트림 URL 생성 (캐시 방지용 랜덤 키 추가)
            const streamUrl = `http://${ip}:81/stream?key=${streamKey}&t=${Date.now()}`;
            console.log("Setting stream URL:", streamUrl); // 디버깅용
            videoRef.current.src = streamUrl;
          }
        }, 300);

        return () => clearTimeout(timer);
      }
    }, [cameraId, streamKey, cameraList, ip]);

    if (!cameraId) return null;

    return (
      <div className="modal-camera-feed">
        <div className="modal-camera-image">
          <img
            ref={videoRef}
            src={initialStreamUrl}
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

  // 맵 컴포넌트
  const renderMapComponent = () => (
    <div className="map-container">
      <img src="https://placehold.co/800x600" alt="지도" className="map-placeholder" />
      <div className="map-overlay">
        <span>맵 API가 여기에 로드될 예정입니다</span>
      </div>

      <div className="map-marker incident" title="사고위치"></div>
      <div className="map-marker vehicle" title="긴급차량 1"></div>
      <div className="map-marker parking" title="불법주차"></div>
      <div className="map-marker parking-2" title="불법주차"></div>

      <div className="map-controls">
        <button className="map-control-button">⬆️</button>
        <div className="map-control-row">
          <button className="map-control-button">⬅️</button>
          <button className="map-control-button">➡️</button>
        </div>
        <button className="map-control-button">⬇️</button>
        <button className="map-control-button">+</button>
        <button className="map-control-button">-</button>
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
        onClick={() => {
          setModalCamera(id); // 모달 표시 트리거
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
          {!isStreamPaused ? (
            <img
              src={streamUrl}
              alt={`카메라 ${id}`}
              onError={(e) => {
                // 이미지 로드 실패 시 대체 이미지 표시
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://placehold.co/400x225/1f2937/cccccc?text=Connection+failed';
              }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className='stream-paused'>
              <span>Looking at modal</span>
            </div>
          )}
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
                    {renderMapComponent()}
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
                {renderMapComponent()}
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
                      {/* <button className="action-button message">차주 문자 발송</button> */}
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
              streamKey={streamKey}
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