import { v4 as ___guid } from 'uuid';
import { Component, OnInit, OnDestroy, ViewContainerRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormBuilder, FormGroup } from '@angular/forms';

import { SubSink } from 'subsink';
import { combineLatest, Observable } from 'rxjs';

import { FlowBuilderStateFrame, FlowBuilderStateProvider } from '@app/features/convs-mgr/stories/builder/flow-builder/state';
import { FlowEditorStateProvider, WFlowService } from '@app/state/convs-mgr/wflows';
import { ChangeTrackerService } from '@app/features/convs-mgr/stories/builder/flow-builder/state';

import { FlowControl } from '../../providers/flow-controls.const';
import { EditorComponentFactory } from '../../services/editor-component-factory.service';
import { _GetFlowComponentForm } from '../../providers/flow-forms-build-factory.util';
import { _MapToFlowControl } from '../../utils/map-to-flow-element.util';


@Component({
  selector: 'app-flow-editor',
  templateUrl: './flow-editor.component.html',
  styleUrls: ['./flow-editor.component.scss']
})
export class FlowEditorComponent implements OnInit, OnDestroy 
{
  private _sbS = new SubSink();
  droppedElements: Observable<FlowControl[]>;

  @ViewChild('vcr', { static: true, read: ViewContainerRef })
  vcr!: ViewContainerRef;

  private _state$$: Observable<FlowBuilderStateFrame>;

  constructor( private flowStateProvider: FlowEditorStateProvider,
               private _flowBuilderState: FlowBuilderStateProvider,
               private editorComponentFactory: EditorComponentFactory,
               private _fb: FormBuilder,
               private trackerService: ChangeTrackerService,
               private _wFlowService: WFlowService,
               private cdr: ChangeDetectorRef,
  ) { 
    this.droppedElements = this.flowStateProvider.get();
  }

  ngOnInit(): void {
   this._sbS.sink = this.trackerService.change$.subscribe();

   this.initEditor();
  }

  async initEditor() {
   this._state$$  = this._flowBuilderState.initialize();

   const activeScreen$ = this._flowBuilderState.activeScreen$;

    this._sbS.sink = combineLatest([this._state$$, activeScreen$]).subscribe(([state, screen])=> {
      if(state) {
        const allElementsData = state.flow.flow.screens[screen].layout.children;

        if(allElementsData && allElementsData.length > 0) {

          for(const elem of allElementsData) {
            // Map elem to flow control
            const flowControlElem = _MapToFlowControl(elem) as FlowControl;
            // Build form
            const elementForm  = _GetFlowComponentForm(this._fb, elem);

            // use the flow control to load the component
            this.createField(flowControlElem, elementForm);
          }
        }
      }
    })
  }
  
  /** Function handling drag and drop functionality for a component */
  drop(event: CdkDragDrop<FlowControl[]>) {
    const draggedData = event.item.data;

    if (draggedData) {
      // Assign a unique ID using UUID
      draggedData.id = ___guid(); 
      draggedData.dropped = true;
      
      // Handle array item transfers
        // if (event.previousContainer === event.container) {
          // this.droppedElements.subscribe((_val) => {
          //   moveItemInArray(_val, event.previousIndex, event.currentIndex)
          //   console.log(_val, event.previousIndex, event.currentIndex, 'move items')
          // })
          
        // }else {
        //   transferArrayItem(
        //     event.previousContainer.data,
        //     event.container.data,
        //     event.previousIndex,
        //     event.currentIndex,
        //   );
        // }

        this.cdr.detectChanges();
        this.flowStateProvider.setControls(draggedData); // Update the state provider
    }
  }

  /** Opening an editable field when user clicks on a dropped element */
  createField(element: FlowControl, form?: FormGroup) {
    if (element.dropped) {

      const componentRef = this.editorComponentFactory.createEditorComponent(element, this.vcr);
          
      componentRef.instance.control = element;

      componentRef.instance.elementForm = form;

      componentRef.instance.type = element.type;  // Pass the value to the component

      componentRef.changeDetectorRef.detectChanges();
    }
  }   

  ngOnDestroy(): void {
    this._sbS.unsubscribe()
   }
}

