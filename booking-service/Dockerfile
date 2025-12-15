# 1. Node.js 공식 이미지 사용
FROM node:20

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 패키지 파일 복사 (가장 먼저 복사하여 캐싱 활용)
COPY package*.json ./

# 4. 종속성 설치 (이 단계가 누락되면 위의 MODULE_NOT_FOUND 오류가 발생합니다!)
RUN npm install

# 5. 소스 코드 복사
COPY . .

# 6. 서비스 포트 노출
EXPOSE 3002

# 7. 서비스 실행 명령어 (
CMD [ "node", "server.js" ] 