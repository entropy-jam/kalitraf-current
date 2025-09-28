# 🔍 SSE Diagnostics Report
Generated: 2025-09-28T00:11:00.819727

## 📊 Summary
- **Total Tests**: 10
- **Successful**: 9 ✅
- **Failed**: 1 ❌
- **Partial**: 0 ⚠️
- **Success Rate**: 90.0%

## 🧪 Test Results

### ✅ SSE Server Connection
**Status**: success

**Details**:
- status_code: 200
- content_type: text/event-stream
- connection_established: True
- messages_received: 3
- sample_messages: [{'type': 'welcome', 'message': 'Connected to CHP Traffic Monitor SSE', 'timestamp': '2025-09-28T00:11:00.823870'}, {'type': 'incident_update', 'data': {'center': 'BFCC', 'centerName': 'Bakersfield', 'incidents': [{'id': '0267', 'time': '8:46 PM', 'type': 'Trfc Collision-No Inj', 'location': 'SR58 W / MARTIN LUTHER KING BLVD OFR', 'area': 'WB SR58 JEO MLK', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0264', 'time': '8:44 PM', 'type': 'Hit and Run No Injuries', 'location': '6500 Kimberly Ave', 'area': '5605 Ashland St', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0263', 'time': '8:36 PM', 'type': 'Traffic Hazard', 'location': '0 Sr178', 'area': 'WB 178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0260', 'time': '8:31 PM', 'type': 'Trfc Collision-1141 Enrt', 'location': 'Jewetta Ave W / Rosedale Hwy', 'area': 'I/S', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0251', 'time': '8:02 PM', 'type': 'Trfc Collision-No Inj', 'location': '0 Sr178', 'area': 'EB SR178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0230', 'time': '6:30 PM', 'type': 'Trfc Collision-No Inj', 'location': '226 Shattuck Ave', 'area': '', 'details': 'Buttonwillow', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0002', 'time': '12:04 AM', 'type': 'Traffic Advisory', 'location': 'Bakersfield Traffic Advisories', 'area': 'Bakersfield Traffic Advisories', 'details': 'BF', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'incidentCount': 7, 'timestamp': '2025-09-28T00:11:03.606947', 'hasChanges': True, 'changes': {'new_incidents': [{'id': '0267', 'time': '8:46 PM', 'type': 'Trfc Collision-No Inj', 'location': 'SR58 W / MARTIN LUTHER KING BLVD OFR', 'area': 'WB SR58 JEO MLK', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0264', 'time': '8:44 PM', 'type': 'Hit and Run No Injuries', 'location': '6500 Kimberly Ave', 'area': '5605 Ashland St', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0263', 'time': '8:36 PM', 'type': 'Traffic Hazard', 'location': '0 Sr178', 'area': 'WB 178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0260', 'time': '8:31 PM', 'type': 'Trfc Collision-1141 Enrt', 'location': 'Jewetta Ave W / Rosedale Hwy', 'area': 'I/S', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0251', 'time': '8:02 PM', 'type': 'Trfc Collision-No Inj', 'location': '0 Sr178', 'area': 'EB SR178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0230', 'time': '6:30 PM', 'type': 'Trfc Collision-No Inj', 'location': '226 Shattuck Ave', 'area': '', 'details': 'Buttonwillow', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0002', 'time': '12:04 AM', 'type': 'Traffic Advisory', 'location': 'Bakersfield Traffic Advisories', 'area': 'Bakersfield Traffic Advisories', 'details': 'BF', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'removed_incidents': []}, 'status': 'success'}}]

### ✅ SSE Message Broadcasting
**Status**: success

**Details**:
- message_types_received: ['welcome', 'incident_update', 'scrape_summary']
- monitoring_duration: 5.849416971206665

### ✅ SSE Reconnection
**Status**: success

**Details**:
- successful_connections: 3
- total_attempts: 3

### ✅ SSE Data Format
**Status**: success

**Details**:
- messages_analyzed: 5
- sample_messages: [{'type': 'welcome', 'message': 'Connected to CHP Traffic Monitor SSE', 'timestamp': '2025-09-28T00:11:09.472606'}, {'type': 'incident_update', 'data': {'center': 'BFCC', 'centerName': 'Bakersfield', 'incidents': [{'id': '0267', 'time': '8:46 PM', 'type': 'Trfc Collision-No Inj', 'location': 'SR58 W / MARTIN LUTHER KING BLVD OFR', 'area': 'WB SR58 JEO MLK', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0264', 'time': '8:44 PM', 'type': 'Hit and Run No Injuries', 'location': '6500 Kimberly Ave', 'area': '5605 Ashland St', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0263', 'time': '8:36 PM', 'type': 'Traffic Hazard', 'location': '0 Sr178', 'area': 'WB 178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0260', 'time': '8:31 PM', 'type': 'Trfc Collision-1141 Enrt', 'location': 'Jewetta Ave W / Rosedale Hwy', 'area': 'I/S', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0251', 'time': '8:02 PM', 'type': 'Trfc Collision-No Inj', 'location': '0 Sr178', 'area': 'EB SR178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0230', 'time': '6:30 PM', 'type': 'Trfc Collision-No Inj', 'location': '226 Shattuck Ave', 'area': '', 'details': 'Buttonwillow', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0002', 'time': '12:04 AM', 'type': 'Traffic Advisory', 'location': 'Bakersfield Traffic Advisories', 'area': 'Bakersfield Traffic Advisories', 'details': 'BF', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'incidentCount': 7, 'timestamp': '2025-09-28T00:11:15.362978', 'hasChanges': True, 'changes': {'new_incidents': [{'id': '0267', 'time': '8:46 PM', 'type': 'Trfc Collision-No Inj', 'location': 'SR58 W / MARTIN LUTHER KING BLVD OFR', 'area': 'WB SR58 JEO MLK', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0264', 'time': '8:44 PM', 'type': 'Hit and Run No Injuries', 'location': '6500 Kimberly Ave', 'area': '5605 Ashland St', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0263', 'time': '8:36 PM', 'type': 'Traffic Hazard', 'location': '0 Sr178', 'area': 'WB 178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0260', 'time': '8:31 PM', 'type': 'Trfc Collision-1141 Enrt', 'location': 'Jewetta Ave W / Rosedale Hwy', 'area': 'I/S', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0251', 'time': '8:02 PM', 'type': 'Trfc Collision-No Inj', 'location': '0 Sr178', 'area': 'EB SR178 JWO DEMOCRAT', 'details': 'Bakersfield', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Bakersfield']}}, {'id': '0230', 'time': '6:30 PM', 'type': 'Trfc Collision-No Inj', 'location': '226 Shattuck Ave', 'area': '', 'details': 'Buttonwillow', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0002', 'time': '12:04 AM', 'type': 'Traffic Advisory', 'location': 'Bakersfield Traffic Advisories', 'area': 'Bakersfield Traffic Advisories', 'details': 'BF', 'center_code': 'BFCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'removed_incidents': []}, 'status': 'success'}}, {'type': 'incident_update', 'data': {'center': 'BSCC', 'centerName': 'Barstow', 'incidents': [{'id': '0201', 'time': '8:46 PM', 'type': 'Traffic Hazard', 'location': '6100 Mm247 N Sbd 61.00', 'area': 'NB', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0200', 'time': '8:46 PM', 'type': 'Trfc Collision-Unkn Inj', 'location': 'I15 S / Yermo (calico) Exit 194', 'area': 'I15 S / YERMO (CALICO) EXIT 194', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0184', 'time': '8:16 PM', 'type': 'Traffic Hazard', 'location': 'I15 N / Hodge Rd', 'area': 'NB JNO', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0185', 'time': '8:16 PM', 'type': 'Traffic Hazard', 'location': 'I15 N / Wild Wash Rd Ofr', 'area': 'BTWN WW AND HODGE', 'details': 'Victorville', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0177', 'time': '7:26 PM', 'type': 'Hit and Run No Injuries', 'location': '31150 Balsa Ave', 'area': 'IFO', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0139', 'time': '3:59 PM', 'type': 'Road/Weather Conditions', 'location': '63683 Sr62', 'area': 'MORONGO CHP', 'details': 'Morongo Basin', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0107', 'time': '1:18 PM', 'type': 'Roadway Flooding', 'location': '5600 Mm62 W Sbd 56.00', 'area': '', 'details': 'Morongo Basin', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0100', 'time': '12:55 PM', 'type': 'Road/Weather Conditions', 'location': '300 E Mountain View St', 'area': 'BARSTOW CHP', 'details': 'BS', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0083', 'time': '11:27 AM', 'type': 'Road/Weather Conditions', 'location': '8500 Mm40 E Sbd R85.00', 'area': 'I40 MM85  - KELBAKER', 'details': 'Needles', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'incidentCount': 9, 'timestamp': '2025-09-28T00:11:15.363556', 'hasChanges': True, 'changes': {'new_incidents': [{'id': '0201', 'time': '8:46 PM', 'type': 'Traffic Hazard', 'location': '6100 Mm247 N Sbd 61.00', 'area': 'NB', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0200', 'time': '8:46 PM', 'type': 'Trfc Collision-Unkn Inj', 'location': 'I15 S / Yermo (calico) Exit 194', 'area': 'I15 S / YERMO (CALICO) EXIT 194', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0184', 'time': '8:16 PM', 'type': 'Traffic Hazard', 'location': 'I15 N / Hodge Rd', 'area': 'NB JNO', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0185', 'time': '8:16 PM', 'type': 'Traffic Hazard', 'location': 'I15 N / Wild Wash Rd Ofr', 'area': 'BTWN WW AND HODGE', 'details': 'Victorville', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0177', 'time': '7:26 PM', 'type': 'Hit and Run No Injuries', 'location': '31150 Balsa Ave', 'area': 'IFO', 'details': 'Barstow', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'blocking', 'details': ['Barstow']}}, {'id': '0139', 'time': '3:59 PM', 'type': 'Road/Weather Conditions', 'location': '63683 Sr62', 'area': 'MORONGO CHP', 'details': 'Morongo Basin', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0107', 'time': '1:18 PM', 'type': 'Roadway Flooding', 'location': '5600 Mm62 W Sbd 56.00', 'area': '', 'details': 'Morongo Basin', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0100', 'time': '12:55 PM', 'type': 'Road/Weather Conditions', 'location': '300 E Mountain View St', 'area': 'BARSTOW CHP', 'details': 'BS', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}, {'id': '0083', 'time': '11:27 AM', 'type': 'Road/Weather Conditions', 'location': '8500 Mm40 E Sbd R85.00', 'area': 'I40 MM85  - KELBAKER', 'details': 'Needles', 'center_code': 'BSCC', 'is_new': True, 'is_relevant': True, 'lane_blockage': {'status': 'no_blockage', 'details': []}}], 'removed_incidents': []}, 'status': 'success'}}]

### ✅ SSE Performance
**Status**: success

**Details**:
- total_messages: 10
- total_time: 5.809337854385376
- messages_per_second: 1.7213665740668123
- average_interval: 0.6454810036553277

### ✅ Railway Server Testing
**Status**: success

**Details**:
- endpoints: {'/': {'status_code': 200, 'content_type': 'text/html', 'expected_content_type': 'text/html', 'content_type_match': True, 'description': 'Frontend serving'}, '/health': {'status_code': 200, 'content_type': 'application/json', 'expected_content_type': 'application/json', 'content_type_match': True, 'description': 'Health check'}, '/api/incidents/stream': {'status_code': 200, 'content_type': 'text/event-stream', 'expected_content_type': 'text/event-stream', 'content_type_match': True, 'description': 'SSE endpoint', 'sse_headers': {'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*'}, 'sample_message': {'type': 'welcome', 'message': 'Connected to CHP Traffic Monitor SSE', 'timestamp': '2025-09-28T00:11:21.185613'}}}
- successful_endpoints: 3
- total_endpoints: 3

### ❌ Frontend Rendering
**Status**: failed

**Details**:
- html_length: 11166
- missing_elements: ['CHP Traffic Monitor', 'theme-toggle', 'connection-status']
- missing_js_files: []
- css_present: True
- has_incidents_container: True
- has_controls: True

**Errors**:
- Missing HTML elements: ['CHP Traffic Monitor', 'theme-toggle', 'connection-status']
- Missing JS files: []

### ✅ Data Display
**Status**: success

**Details**:
- incident_analysis: {'total_samples': 3, 'centers_represented': ['BCCC', 'BFCC', 'BSCC'], 'total_incidents': 27, 'incident_types': ['CLOSURE of a Road', 'Trfc Collision-No Inj', 'Trfc Collision-Unkn Inj', 'Traffic Advisory', 'Traffic Hazard', 'Hit and Run No Injuries', 'Road/Weather Conditions', 'Roadway Flooding', 'Trfc Collision-1141 Enrt'], 'has_lane_blockage_info': True, 'has_timestamps': True, 'has_locations': True}

### ✅ UI Functionality
**Status**: success

**Details**:
- js_files: {'js/app-railway.js': {'status': 'available', 'size': 14675, 'has_classes': True, 'has_functions': True}, 'js/services/sse-service.js': {'status': 'available', 'size': 6026, 'has_classes': True, 'has_functions': True}, 'js/renderers/incident-renderer.js': {'status': 'available', 'size': 9717, 'has_classes': True, 'has_functions': True}, 'js/services/incident-service.js': {'status': 'available', 'size': 3335, 'has_classes': True, 'has_functions': False}, 'js/controllers/app-controller.js': {'status': 'available', 'size': 14582, 'has_classes': True, 'has_functions': True}, 'js/ui-controller.js': {'status': 'available', 'size': 5454, 'has_classes': True, 'has_functions': True}}
- css_files: {'assets/styles.css': {'status': 'error', 'error': 'Session is closed'}}
- js_availability_ratio: 6/6
- css_availability_ratio: 0/1

### ✅ Incident Rendering Validation
**Status**: success

**Details**:
- rendering_validation: {'samples_analyzed': 2, 'rendering_requirements': {'sample_1_top_level': {'missing': [], 'complete': True}, 'sample_1_incident_level': {'missing': [], 'complete': True}, 'sample_2_top_level': {'missing': [], 'complete': True}, 'sample_2_incident_level': {'missing': [], 'complete': True}}, 'data_consistency': {'sample_1_data_types': True, 'sample_2_data_types': True}, 'format_compliance': {'sample_1_lane_blockage': True, 'sample_2_lane_blockage': True}}
- overall_completeness: {'top_level_complete': True, 'incident_level_complete': True, 'lane_blockage_valid': True, 'data_types_valid': True}

