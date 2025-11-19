from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.clients.models import Client
from apps.architects.models import Architect
from .models import Project

User = get_user_model()


class ProjectModelTests(TestCase):
    """Test Project model functionality"""
    
    def setUp(self):
        """Set up test data"""
        # Clear any existing test data
        Project.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()
        
        self.client_obj = Client.objects.create(
            name="Test Client",
            contact_email="client@test.com",
            phone="+1234567890"
        )
        
        self.architect = Architect.objects.create(
            name="Test Architect",
            contact_email="architect@test.com",
            phone="+1234567891"
        )
        
        self.manager = User.objects.create_user(
            username="manager@test.com",
            email="manager@test.com",
            password="testpass123",
            first_name="Manager",
            last_name="User",
            role="manager"
        )
        
        self.project_data = {
            'year': 2025,
            'project_name': 'Test Project',
            'project_type': 'M,E',
            'status': 'not_started',
            'client': self.client_obj,
            'architect_designer': self.architect,
            'mechanical_manager': self.manager,
            'due_date': timezone.now().date() + timedelta(days=30),
            'address': '123 Test Street'
        }
    
    def test_create_project(self):
        """Test creating a project"""
        project = Project.objects.create(**self.project_data)
        self.assertEqual(project.project_name, 'Test Project')
        self.assertEqual(project.status, 'not_started')
        self.assertTrue(project.job_number)
    
    def test_project_types_list(self):
        """Test project types list conversion"""
        project = Project.objects.create(**self.project_data)
        types_list = project.project_types_list  # Use property instead of method
        self.assertEqual(types_list, ['M', 'E'])
    
    def test_has_project_type_method(self):
        """Test project type checking method"""
        project = Project.objects.create(**self.project_data)
        # If you have a has_project_type method, use it, otherwise test the property
        self.assertIn('M', project.project_types_list)
        self.assertIn('E', project.project_types_list)
        self.assertNotIn('P', project.project_types_list)
    
    def test_is_overdue_calculation(self):
        """Test overdue project calculation"""
        # Past due date
        past_project = Project.objects.create(
            **{**self.project_data, 'due_date': timezone.now().date() - timedelta(days=1)}
        )
        self.assertTrue(past_project.is_overdue)
        
        # Future due date
        future_project = Project.objects.create(
            **{**self.project_data, 'due_date': timezone.now().date() + timedelta(days=1)}
        )
        self.assertFalse(future_project.is_overdue)
    
    def test_days_until_due_calculation(self):
        """Test days until due calculation"""
        future_date = timezone.now().date() + timedelta(days=10)
        project = Project.objects.create(
            **{**self.project_data, 'due_date': future_date}
        )
        self.assertEqual(project.days_until_due, 10)


class ProjectAPITests(APITestCase):
    """Test Project API endpoints"""
    
    def setUp(self):
        """Set up test data for API tests"""
        # Clear existing data
        Project.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()
        
        self.client_obj = Client.objects.create(
            name="API Test Client",
            contact_email="apiclient@test.com",
            phone="+1234567890"
        )
        
        self.architect = Architect.objects.create(
            name="API Test Architect",
            contact_email="apiarchitect@test.com",
            phone="+1234567891"
        )
        
        # Create different role users
        self.admin_user = User.objects.create_user(
            username="admin@test.com",
            email="admin@test.com",
            password="testpass123",
            first_name="Admin",
            last_name="User",
            role="admin"
        )
        
        self.manager_user = User.objects.create_user(
            username="manager@test.com",
            email="manager@test.com",
            password="testpass123",
            first_name="Manager",
            last_name="User",
            role="manager"
        )
        
        self.employee_user = User.objects.create_user(
            username="employee@test.com",
            email="employee@test.com",
            password="testpass123",
            first_name="Employee",
            last_name="User",
            role="employee"
        )
        
        self.client_user = User.objects.create_user(
            username="clientuser@test.com",
            email="clientuser@test.com",
            password="testpass123",
            first_name="Client",
            last_name="User",
            role="client"
        )
        
        # Link client user to client
        self.client_obj.user_account = self.client_user
        self.client_obj.save()
        
        # Create exactly 2 test projects
        self.project1 = Project.objects.create(
            year=2025,
            project_name="Test Project 1",
            project_type="M,E",
            status="not_started",
            client=self.client_obj,
            architect_designer=self.architect,
            mechanical_manager=self.manager_user,
            due_date=timezone.now().date() + timedelta(days=30),
            address="123 Test Street"
        )
        
        self.project2 = Project.objects.create(
            year=2025,
            project_name="Test Project 2",
            project_type="P,FP",
            status="in_progress",
            client=self.client_obj,
            architect_designer=self.architect,
            mechanical_manager=self.employee_user,
            due_date=timezone.now().date() + timedelta(days=15),
            address="456 Test Avenue"
        )
        
        self.client = APIClient()
    
    def get_token(self, username, password):
        """Helper method to get JWT token"""
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': username,
            'password': password
        })
        return response.data['access']
    
    def test_list_projects_admin(self):
        """Test admin can see all projects"""
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Should see exactly 2 projects
    
    def test_list_projects_manager(self):
        """Test manager can see all projects"""
        token = self.get_token('manager@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_list_projects_employee(self):
        """Test employee can only see assigned projects"""
        token = self.get_token('employee@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see project they manage (project2)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['project_name'], 'Test Project 2')
    
    def test_list_projects_client(self):
        """Test client can only see their projects"""
        token = self.get_token('clientuser@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200OK)
        # Client should see projects where they are the client (both projects)
        self.assertEqual(len(response.data), 2)
    
    def test_create_project_manager(self):
        """Test manager can create project"""
        token = self.get_token('manager@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        data = {
            'year': 2025,
            'project_name': 'New API Project',
            'project_type': 'M,EM',
            'status': 'not_started',
            'client': self.client_obj.id,
            'architect_designer': self.architect.id,
            'due_date': (timezone.now().date() + timedelta(days=60)).isoformat(),
            'address': '789 New Project Street'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Debug response if failing
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Create project failed: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['project_name'], 'New API Project')
    
    def test_create_project_employee(self):
        """Test employee can create project (auto-assigned as manager)"""
        token = self.get_token('employee@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list')
        data = {
            'year': 2025,
            'project_name': 'Employee Created Project',
            'project_type': 'E',
            'status': 'not_started',
            'client': self.client_obj.id,
            'due_date': (timezone.now().date() + timedelta(days=45)).isoformat(),
            'address': '123 Employee Street'
        }
        
        response = self.client.post(url, data, format='json')
        
        # Debug response if failing
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Employee create project failed: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should be auto-assigned as mechanical_manager
        self.assertEqual(response.data['mechanical_manager'], self.employee_user.id)
    
    def test_filter_projects_by_status(self):
        """Test filtering projects by status"""
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list') + '?status=in_progress'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only project2 is in_progress
        self.assertEqual(response.data[0]['project_name'], 'Test Project 2')
    
    def test_filter_projects_by_project_type(self):
        """Test filtering projects by project type"""
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list') + '?project_type=M'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only project1 has M
        self.assertEqual(response.data[0]['project_name'], 'Test Project 1')
    
    def test_search_projects(self):
        """Test searching projects"""
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-list') + '?search=Project 2'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['project_name'], 'Test Project 2')
    
    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-dashboard-stats')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_projects', response.data)
        self.assertIn('by_status', response.data)
        self.assertEqual(response.data['total_projects'], 2)
    
    def test_overdue_projects(self):
        """Test overdue projects endpoint"""
        # Create an overdue project
        overdue_project = Project.objects.create(
            year=2025,
            project_name="Overdue Project",
            project_type="M",
            status="in_progress",
            client=self.client_obj,
            architect_designer=self.architect,
            mechanical_manager=self.manager_user,
            due_date=timezone.now().date() - timedelta(days=1),
            address="123 Overdue Street"
        )
        
        token = self.get_token('admin@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('project-overdue')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['project_name'], 'Overdue Project')


class ProjectValidationTests(APITestCase):
    """Test project validation rules"""
    
    def setUp(self):
        # Clear existing data
        Project.objects.all().delete()
        Client.objects.all().delete()
        User.objects.all().delete()
        
        self.client_obj = Client.objects.create(
            name="Validation Client",
            contact_email="validation@test.com"
        )
        
        self.manager = User.objects.create_user(
            username="validation@test.com",
            email="validation@test.com",
            password="testpass123",
            role="manager"
        )
        
        self.client = APIClient()
        token = self.get_token('validation@test.com', 'testpass123')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    def get_token(self, username, password):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {
            'username': username,
            'password': password
        })
        return response.data['access']
    
    def test_past_due_date_validation(self):
        """Test that past due dates are rejected"""
        url = reverse('project-list')
        data = {
            'project_name': 'Invalid Date Project',
            'project_type': 'M',
            'status': 'not_started',
            'client': self.client_obj.id,
            'due_date': (timezone.now().date() - timedelta(days=1)).isoformat(),
            'address': '123 Test Street'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('due_date', response.data)