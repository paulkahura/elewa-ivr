import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageTemplate } from '@app/model/convs-mgr/functions';
import { MessageTemplatesService } from '@app/private/state/message-templates';
import { Observable, switchMap, take, tap } from 'rxjs';
import { SubSink } from 'subsink';
import { createEmptyTemplateForm } from '../../providers/create-empty-message-template-form.provider';

@Component({
  selector: 'app-message-template-form',
  templateUrl: './message-template-form.component.html',
  styleUrls: ['./message-template-form.component.scss'],
})
export class MessageTemplateFormComponent implements OnInit{
  @ViewChild('textAreaElement') textAreaElement: ElementRef;
  
  template$: Observable<MessageTemplate>;

  templateForm: FormGroup;
  template: MessageTemplate;
  content: FormGroup;

  action: string;
  panelOpenState = false;
  isSaving = false;


  channels: string[] = ['WhatsApp', 'Messenger'];
  categories: string[] = ['AUTHENTICATION', 'MARKETING', 'UTILITY'];
  languages: { display: string; value: string }[] = [
    { display: 'English', value: 'en' },
    { display: 'Spanish', value: 'es' },
    { display: 'Swahili', value: 'sw' }
  ];
  
  referenceForm: FormGroup;
  nextVariableId: number;
  newVariables: string[] = [];
  private _sbS = new SubSink();

  selectedOptions: DropdownOptions = {
    channel: '',
    category: '',
    language: ''
  };


  constructor(
    private fb: FormBuilder,
    private _messageTemplatesService: MessageTemplatesService,
    private _route:ActivatedRoute,
    private _route$$: Router,
  ) {}

  ngOnInit() {
    this.action = this._route$$.url.split('/')[2];

    if (this.action === 'create') {
      this.templateForm = createEmptyTemplateForm(this.fb);
    } else {
      this.initPage();
    }
    // Subscribe to changes in the content.body control
    this.subscribeToBodyControlChanges();
    
  }

  initPage()
  {
    this.template$ = this._messageTemplatesService.getActiveTemplate$();

    this._sbS.sink = this.template$.subscribe((template) => {
      if (template) {
        this.templateForm = this.fb.group({
          name: [template.name, Validators.required],
          category: ['MARKETING'], 
          language: ['en'],
          content: this.fb.group({
            header: [`${template.content.header}`],
            body: this.fb.group({
              text: [template.content.body.text, Validators.required],
              newVariable: ['', Validators.required],
              newPlaceholder: ['', Validators.required],
              examples: this.fb.array([]),
            }),
            footer: [template.content.footer],
            templateId: [template.id],
            sent: [''],
          }),
          buttons: this.fb.array([]), 
        });
      }
    });

  }
  subscribeToBodyControlChanges() {
    const bodyControl = this.templateForm.get('content.body.text') as FormControl;
    bodyControl.valueChanges.subscribe((updatedBody) => {
      this.updateReferencesFromBody(updatedBody);
    });
  }

addVariable() {
  const formContent = this.templateForm.get('content') as FormGroup;
  const formBody = formContent.get('body') as FormGroup;

  const newVariable = formBody.get('newVariable')?.value;
  const newPlaceholder = formBody.get('newPlaceholder')?.value;
  const variablesArray = formBody.get('examples') as FormArray; 

  const variableId = this.nextVariableId++; 

  const variableGroup = this.fb.group({
    id: variableId,
    variable: newPlaceholder,
    placeholder: newVariable,
  });

  variablesArray.push(variableGroup);

  // Surround the newVariable with {{}} and append it to the current content.body
  const bodyControl = formBody.get('text') as FormControl;
  const updatedBody = `${bodyControl.value}{{${newVariable}}}`;
  bodyControl.setValue(updatedBody);

  // Track new variables
  this.newVariables.push(newVariable);

  // Clear the input fields
  formBody.get('newVariable')?.reset();
  formBody.get('newPlaceholder')?.reset();
}

removeVariable(index: number) {
  const formContent = this.templateForm.get('content') as FormGroup;
  const formBody = formContent.get('body') as FormGroup;

  const variablesArray = formBody.get('examples') as FormArray;
  const bodyControl = formBody.get('text') as FormControl;
  const placeholder = variablesArray.at(index).get('placeholder')?.value;

  // Remove the variable from the body
  let updatedText = bodyControl.value;
  const variableTag = `{{${placeholder}}}`;

  updatedText = updatedText.replace(new RegExp(variableTag, 'g'), '');

  // Remove the new variable if it exists in the body
  const variableIndex = this.newVariables.indexOf(placeholder);
  if (variableIndex !== -1) {
    const newVariable = this.newVariables.splice(variableIndex, 1)[0];
    updatedText = updatedText.replace(newVariable, '');
  }

  bodyControl.setValue(updatedText);

  variablesArray.removeAt(index);
}
  updateReferencesFromBody(updatedBody: string) {
    const formContent = this.templateForm.get('content') as FormGroup;
    const formBody = formContent.get('body') as FormGroup;

    const referencesArray = formBody.get('examples') as FormArray;

    // Iterate over the references and check if their placeholders exist in the updatedBody
    for (let i = referencesArray.length - 1; i >= 0; i--) {
      const referenceGroup = referencesArray.at(i) as FormGroup;
      const placeholder = referenceGroup.get('placeholder')?.value;
      
      // If the placeholder does not exist in the updated body, remove the reference
      if (!updatedBody.includes(`{{${placeholder}}}`)) {
        referencesArray.removeAt(i);
        // Also remove the associated new variable
        const variableIndex = this.newVariables.indexOf(placeholder);
        if (variableIndex !== -1) {
          this.newVariables.splice(variableIndex, 1);
        }
      }
    }
  }


  onSelectedOptionsChange(selectedOptions: DropdownOptions) {
    // Handle the selected options received from the child component
    this.selectedOptions = selectedOptions;
    console.log('Selected Options in Parent:', this.selectedOptions);
  }
    
  cancel() {
    this._route$$.navigate(['/messaging'])
  }
  save() {
    this.isSaving = true
    console.log('saving',this.templateForm.value);
    this._messageTemplatesService.addMessageTemplate(this.templateForm.value).subscribe((response) => {
      this.isSaving  = false;
      console.log('Template sent to firebase', response);
    })
    // this.template = this.templateForm.value
    // this.messageTemplatesService.createTemplate(this.template).subscribe((response) => {
    //   console.log('Template created:', response);
    // });
    this.isSaving = false;

  }

  
}
export interface DropdownOptions {
  channel: string;
  category: string;
  language: string;
}